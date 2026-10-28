// Remplit la base avec des données de démonstration : npm run db:seed
// À n'utiliser qu'en développement ou pour une démo (jamais sur la vraie base).
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { eq, inArray } from "drizzle-orm";
import { closeDb, db } from "../src/lib/db";
import { bookings, conversations, reviews, users } from "../src/lib/db/schema";
import { addDays, todayInGuyane } from "../src/lib/dates";
import { newId } from "../src/lib/ids";
import { hashPassword } from "../src/lib/password";
import { computePrice } from "../src/lib/pricing";
import { requestBooking } from "../src/lib/services/bookings";
import { createListing, listingFormSchema } from "../src/lib/services/listings";
import { getOrCreateConversation, postSystemMessage, sendMessage } from "../src/lib/services/messages";
import { DEMO_PASSWORD, demoListings, demoUsers } from "./seed-data";

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    throw new Error("Refus : seed en production. Ajoutez --force si c'est vraiment voulu (base de démo).");
  }
  const emails = demoUsers.map((u) => u.email);
  const existing = await db.select({ id: users.id }).from(users).where(inArray(users.email, emails));
  if (existing.length > 0) {
    if (!process.argv.includes("--reset")) {
      console.log("Données de démo déjà présentes (relancez avec --reset pour les recréer).");
      return;
    }
    await db.delete(users).where(inArray(users.email, emails));
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const ids: Record<string, string> = {};
  for (const u of demoUsers) {
    ids[u.key] = newId();
    await db.insert(users).values({
      id: ids[u.key],
      email: u.email,
      passwordHash,
      name: u.name,
      commune: u.commune,
      phone: u.phone?.replace(/\s/g, "") ?? null,
      bio: u.bio,
      emailVerifiedAt: new Date(),
      createdAt: new Date(Date.now() - 1000 * 3600 * 24 * (60 + Math.random() * 300)),
    });
  }

  const adminEmail = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (adminEmail) {
    const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail.toLowerCase()));
    if (!admin) {
      await db.insert(users).values({
        id: newId(),
        email: adminEmail.toLowerCase(),
        passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? "zouti-admin"),
        name: "Équipe Zouti",
        commune: "cayenne",
        role: "admin",
        emailVerifiedAt: new Date(),
      });
      console.log(`Compte admin : ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ? "(SEED_ADMIN_PASSWORD)" : "zouti-admin"}`);
    }
  }

  const listingIds: Record<string, string> = {};
  for (const l of demoListings) {
    const input = listingFormSchema.parse({
      title: l.title,
      description: l.description,
      category: l.category,
      brand: l.brand ?? "",
      condition: l.condition,
      dayPrice: String(l.dayPrice),
      weekPrice: l.weekPrice ? String(l.weekPrice) : "",
      deposit: String(l.deposit),
      minDays: "1",
      commune: l.commune,
      neighborhood: l.neighborhood ?? "",
      delivery: l.delivery ? "on" : undefined,
      pickupNotes: "Retrait en soirée après 17 h ou le week-end. Je vous explique le fonctionnement sur place.",
    });
    const photo = await readFile(new URL(`./seed-images/${l.key}.jpg`, import.meta.url));
    listingIds[l.key] = await createListing(ids[l.owner], input, [photo]);
  }

  // Locations terminées avec avis, pour peupler les profils.
  const today = todayInGuyane();
  const past = [
    { listing: "debrou", renter: "kevin", owner: "marie", daysAgo: 20, length: 2, ratings: [5, 5], comments: ["Débroussailleuse au top, démarrage au quart de tour. Marie-Laure m'a tout expliqué. Je recommande !", "Kévin a rendu la machine propre et à l'heure. Locataire parfait."] },
    { listing: "karcher", renter: "aline", owner: "kevin", daysAgo: 12, length: 1, ratings: [5, 4], comments: ["Ma terrasse est comme neuve. Matériel impeccable et propriétaire très arrangeant.", "Très bien, petit retard au retour mais prévenu. Merci Aline !"] },
    { listing: "groupe", renter: "yannick", owner: "jean", daysAgo: 35, length: 3, ratings: [4, 5], comments: ["Groupe silencieux qui a tenu toute la coupure de courant. Un peu lourd à transporter.", "Rendu avec le plein, nickel."] },
    { listing: "barnum", renter: "jean", owner: "aline", daysAgo: 8, length: 2, ratings: [5, 5], comments: ["Barnum parfait pour le baptême de ma fille, on a été à l'abri de l'averse. Merci !", "Jean-Michel a pris grand soin du barnum. Au plaisir !"] },
  ];
  for (const p of past) {
    const startDate = addDays(today, -p.daysAgo);
    const endDate = addDays(startDate, p.length - 1);
    const l = demoListings.find((d) => d.key === p.listing)!;
    const price = computePrice({ dayPrice: l.dayPrice * 100, weekPrice: l.weekPrice ? l.weekPrice * 100 : null, days: p.length });
    const bookingId = newId();
    const returnedAt = new Date(`${addDays(endDate, 1)}T12:00:00Z`);
    await db.insert(bookings).values({
      id: bookingId,
      listingId: listingIds[p.listing],
      renterId: ids[p.renter],
      ownerId: ids[p.owner],
      startDate,
      endDate,
      days: p.length,
      dayPrice: l.dayPrice * 100,
      weekPrice: l.weekPrice ? l.weekPrice * 100 : null,
      rentalAmount: price.rentalAmount,
      deposit: l.deposit * 100,
      status: "completed",
      expiresAt: new Date(`${startDate}T12:00:00Z`),
      createdAt: new Date(`${addDays(startDate, -3)}T12:00:00Z`),
      respondedAt: new Date(`${addDays(startDate, -2)}T12:00:00Z`),
      handedOverAt: new Date(`${startDate}T12:00:00Z`),
      returnedAt,
    });
    await db.insert(reviews).values([
      { id: newId(), bookingId, listingId: listingIds[p.listing], authorId: ids[p.renter], targetId: ids[p.owner], role: "renter", rating: p.ratings[0], comment: p.comments[0], createdAt: returnedAt },
      { id: newId(), bookingId, listingId: listingIds[p.listing], authorId: ids[p.owner], targetId: ids[p.renter], role: "owner", rating: p.ratings[1], comment: p.comments[1], createdAt: returnedAt },
    ]);
    const conversationId = await getOrCreateConversation(listingIds[p.listing], ids[p.renter]);
    await sendMessage(ids[p.renter], conversationId, "Bonjour, le matériel est-il disponible ce week-end ?", { silent: true });
    await sendMessage(ids[p.owner], conversationId, "Bonjour ! Oui, envoyez-moi une demande avec vos dates 🙂", { silent: true });
    await postSystemMessage(conversationId, "📦 Matériel rendu, location terminée. Pensez à vous laisser un avis mutuel !");
    await db.update(conversations).set({ renterLastReadAt: new Date(), ownerLastReadAt: new Date() }).where(eq(conversations.id, conversationId));
  }

  // Une demande en attente reçue par Marie-Laure.
  await requestBooking(ids.sandra, {
    listingId: listingIds.tondeuse,
    startDate: addDays(today, 5),
    endDate: addDays(today, 6),
    message: "Bonjour Marie-Laure, je serai de passage à Matoury pour entretenir le terrain de ma mère. Merci !",
  });

  console.log(`✔ ${demoUsers.length} membres, ${demoListings.length} annonces, ${past.length} locations terminées.`);
  console.log(`  Connexion démo : ${demoUsers[0].email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

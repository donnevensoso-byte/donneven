import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { blockedPeriods, bookings, messages, notifications, users } from "@/lib/db/schema";
import { addDays, todayInGuyane } from "@/lib/dates";
import { newId } from "@/lib/ids";
import {
  cancelBooking,
  confirmHandover,
  confirmReturn,
  expireStaleBookings,
  getBookingForUser,
  requestBooking,
  respondToBooking,
} from "@/lib/services/bookings";
import { addBlockedPeriod, createListing, listingFormSchema, searchListings } from "@/lib/services/listings";
import { getOrCreateConversation, listConversations, sendMessage, unreadConversationCount } from "@/lib/services/messages";
import { addBookingPhotos, listBookingPhotos } from "@/lib/services/booking-photos";
import { createReview, ratingSummary } from "@/lib/services/reviews";

let photo: Buffer;

async function makeUser(name: string, commune = "cayenne") {
  const id = newId();
  await db.insert(users).values({ id, email: `${id}@test.gf`, passwordHash: "x", name, commune, emailVerifiedAt: new Date() });
  return id;
}

async function makeListing(ownerId: string, overrides: Record<string, string> = {}) {
  photo ??= await sharp({ create: { width: 64, height: 48, channels: 3, background: "#0b6e4f" } }).png().toBuffer();
  const input = listingFormSchema.parse({
    title: "Nettoyeur haute pression",
    description: "Kärcher K5 en très bon état, avec rallonge et rotabuse.",
    category: "nettoyage",
    condition: "tres_bon",
    dayPrice: "20",
    deposit: "150",
    minDays: "1",
    commune: "cayenne",
    ...overrides,
  });
  return createListing(ownerId, input, [photo]);
}

const today = todayInGuyane();

beforeEach(async () => {
  await db.execute(sql`truncate users, images cascade`);
});

afterAll(async () => {
  await closeDb();
});

describe("cycle de réservation", () => {
  it("demande → acceptation → remise → retour → avis mutuels", async () => {
    const owner = await makeUser("Marie Désiré");
    const renter = await makeUser("Kévin Ho");
    const listingId = await makeListing(owner, { weekPrice: "90" });

    const bookingId = await requestBooking(renter, {
      listingId,
      startDate: addDays(today, 2),
      endDate: addDays(today, 10),
      message: "Bonjour, pour ma terrasse !",
    });
    let [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b).toMatchObject({ status: "pending", days: 9, rentalAmount: 9000 + 4000, paymentMethod: "onsite", serviceFee: 0 });

    // Le propriétaire est notifié et la conversation contient la demande + le message
    const ownerNotifs = await db.select().from(notifications).where(eq(notifications.userId, owner));
    expect(ownerNotifs.map((n) => n.title)).toEqual(["Nouvelle demande de réservation"]);
    const conversationId = await getOrCreateConversation(listingId, renter);
    const thread = await db.select().from(messages).where(eq(messages.conversationId, conversationId));
    expect(thread).toHaveLength(2);
    expect(await unreadConversationCount(owner)).toBe(1);

    await expect(respondToBooking(renter, bookingId, "accept")).rejects.toThrow(/introuvable/);
    await respondToBooking(owner, bookingId, "accept");
    [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b.status).toBe("accepted");
    await expect(respondToBooking(owner, bookingId, "accept")).rejects.toThrow(/déjà été traitée/);

    // Les coordonnées ne sont visibles qu'après confirmation
    const view = await getBookingForUser(renter, bookingId);
    expect(view?.role).toBe("renter");
    expect(await getBookingForUser(await makeUser("Intrus"), bookingId)).toBeNull();

    // Un code de remise à 4 chiffres est tiré à l'acceptation
    [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b.handoverCode).toMatch(/^\d{4}$/);
    // Trop tôt pour la remise (début dans 2 jours)
    await expect(confirmHandover(owner, bookingId, b.handoverCode!)).rejects.toThrow(/veille/);
    await db.update(bookings).set({ startDate: today, endDate: addDays(today, 8) }).where(eq(bookings.id, bookingId));
    // Le retour exige une remise confirmée par code
    await expect(confirmReturn(owner, bookingId)).rejects.toThrow(/remise/);
    const wrong = b.handoverCode === "0000" ? "1111" : "0000";
    await expect(confirmHandover(owner, bookingId, wrong)).rejects.toThrow(/incorrect/);
    await expect(confirmHandover(renter, bookingId, b.handoverCode!)).rejects.toThrow(/introuvable/);
    await confirmHandover(owner, bookingId, b.handoverCode!);
    await confirmReturn(owner, bookingId);
    [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b.status).toBe("completed");

    await createReview(renter, bookingId, 5, "Matériel impeccable, merci !");
    await createReview(owner, bookingId, 4, "Locataire sérieux et ponctuel.");
    await expect(createReview(renter, bookingId, 5, "Encore un avis en double")).rejects.toThrow();
    expect(await ratingSummary(owner)).toEqual({ average: 5, count: 1 });
    expect(await ratingSummary(renter)).toEqual({ average: 4, count: 1 });

    const convs = await listConversations(renter);
    expect(convs).toHaveLength(1);
    expect(convs[0].listingTitle).toBe("Nettoyeur haute pression");
  });

  it("refuse les dates invalides, son propre matériel et les périodes indisponibles", async () => {
    const owner = await makeUser("Jean B.");
    const renter = await makeUser("Aline T.");
    const listingId = await makeListing(owner, { minDays: "2" });
    const req = (start: number, end: number, who = renter) =>
      requestBooking(who, { listingId, startDate: addDays(today, start), endDate: addDays(today, end) });

    await expect(req(-1, 2)).rejects.toThrow(/passée/);
    await expect(req(3, 2)).rejects.toThrow(/après/);
    await expect(req(3, 3)).rejects.toThrow(/minimale/);
    await expect(req(1, 70)).rejects.toThrow(/limitée/);
    await expect(req(1, 3, owner)).rejects.toThrow(/propre/);

    await addBlockedPeriod(owner, listingId, addDays(today, 10), addDays(today, 12));
    await expect(req(9, 11)).rejects.toThrow(/disponible/);
    await req(1, 2);
    await expect(req(2, 4)).rejects.toThrow(/déjà une demande/);
    await db.delete(blockedPeriods);
  });

  it("accepter une demande refuse automatiquement les demandes qui se chevauchent", async () => {
    const owner = await makeUser("Sandra P.");
    const a = await makeUser("Locataire A");
    const c = await makeUser("Locataire C");
    const listingId = await makeListing(owner);
    const first = await requestBooking(a, { listingId, startDate: addDays(today, 5), endDate: addDays(today, 7) });
    const second = await requestBooking(c, { listingId, startDate: addDays(today, 6), endDate: addDays(today, 8) });
    const third = await requestBooking(c, { listingId, startDate: addDays(today, 20), endDate: addDays(today, 21) });

    await respondToBooking(owner, first, "accept");
    const statuses = Object.fromEntries(
      (await db.select({ id: bookings.id, status: bookings.status }).from(bookings)).map((r) => [r.id, r.status]),
    );
    expect(statuses).toEqual({ [first]: "accepted", [second]: "declined", [third]: "pending" });

    // Les dates confirmées sont exclues de la recherche par disponibilité
    const busy = await searchListings({ start: addDays(today, 6), end: addDays(today, 6) });
    const free = await searchListings({ start: addDays(today, 10), end: addDays(today, 11) });
    expect(busy.total).toBe(0);
    expect(free.total).toBe(1);

    await expect(requestBooking(c, { listingId, startDate: addDays(today, 7), endDate: addDays(today, 9) })).rejects.toThrow(/disponible/);
  });

  it("état des lieux en photos : participants seulement, aux bonnes étapes", async () => {
    const owner = await makeUser("Owner photos");
    const renter = await makeUser("Renter photos");
    const stranger = await makeUser("Intrus photos");
    const listingId = await makeListing(owner);
    const bookingId = await requestBooking(renter, { listingId, startDate: today, endDate: addDays(today, 1) });
    // Pas de photos tant que la demande n'est pas acceptée
    await expect(addBookingPhotos(renter, bookingId, "handover", [photo])).rejects.toThrow(/remise/);
    await respondToBooking(owner, bookingId, "accept");
    await expect(addBookingPhotos(stranger, bookingId, "handover", [photo])).rejects.toThrow(/introuvable/);
    await expect(addBookingPhotos(owner, bookingId, "return", [photo])).rejects.toThrow(/retour/);
    expect(await addBookingPhotos(owner, bookingId, "handover", [photo, photo], "Rayure existante")).toBe(2);
    await addBookingPhotos(renter, bookingId, "handover", [photo]);
    await expect(addBookingPhotos(renter, bookingId, "handover", Array(8).fill(photo))).rejects.toThrow(/maximum/);

    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    await confirmHandover(owner, bookingId, b.handoverCode!);
    await addBookingPhotos(renter, bookingId, "return", [photo]);
    await confirmReturn(owner, bookingId);
    await addBookingPhotos(owner, bookingId, "return", [photo]);

    const photos = await listBookingPhotos(bookingId);
    expect(photos.map((p) => p.stage)).toEqual(["handover", "handover", "handover", "return", "return"]);
    expect(photos[0]).toMatchObject({ authorId: owner, note: "Rayure existante", authorName: "Owner photos" });
    // Chaque ajout est tracé dans la conversation
    const conversationId = await getOrCreateConversation(listingId, renter);
    const thread = await db.select().from(messages).where(eq(messages.conversationId, conversationId));
    expect(thread.filter((m) => m.body.startsWith("📸"))).toHaveLength(4);
  });

  it("limite les essais de code de remise", async () => {
    const owner = await makeUser("Owner code");
    const renter = await makeUser("Renter code");
    const listingId = await makeListing(owner);
    const bookingId = await requestBooking(renter, { listingId, startDate: today, endDate: today });
    await respondToBooking(owner, bookingId, "accept");
    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    const wrong = b.handoverCode === "0000" ? "1111" : "0000";
    for (let i = 0; i < 5; i++) await expect(confirmHandover(owner, bookingId, wrong)).rejects.toThrow(/incorrect/);
    await expect(confirmHandover(owner, bookingId, b.handoverCode!)).rejects.toThrow(/Trop d'essais/);
  });

  it("la base refuse deux réservations confirmées qui se chevauchent", async () => {
    const owner = await makeUser("Owner overlap");
    const renter = await makeUser("Renter overlap");
    const listingId = await makeListing(owner);
    const first = await requestBooking(renter, { listingId, startDate: addDays(today, 3), endDate: addDays(today, 5) });
    await respondToBooking(owner, first, "accept");
    const other = await requestBooking(renter, { listingId, startDate: addDays(today, 20), endDate: addDays(today, 21) });
    // Même en contournant le service, la contrainte d'exclusion bloque le chevauchement.
    await expect(
      db.update(bookings).set({ status: "accepted", startDate: addDays(today, 5), endDate: addDays(today, 6) }).where(eq(bookings.id, other)),
    ).rejects.toThrow();
  });

  it("annulations et expiration des demandes", async () => {
    const owner = await makeUser("Yannick L.");
    const renter = await makeUser("Paul R.");
    const listingId = await makeListing(owner);
    const pending = await requestBooking(renter, { listingId, startDate: addDays(today, 3), endDate: addDays(today, 3) });
    await expect(cancelBooking(owner, pending)).rejects.toThrow(/Refuser/);
    await cancelBooking(renter, pending, "Plus besoin");

    const accepted = await requestBooking(renter, { listingId, startDate: addDays(today, 4), endDate: addDays(today, 5) });
    await respondToBooking(owner, accepted, "accept");
    await cancelBooking(owner, accepted, "Machine en panne");
    const [cancelled] = await db.select().from(bookings).where(eq(bookings.id, accepted));
    expect(cancelled).toMatchObject({ status: "cancelled", cancelledBy: "owner", cancelReason: "Machine en panne" });

    const stale = await requestBooking(renter, { listingId, startDate: addDays(today, 6), endDate: addDays(today, 6) });
    await db.update(bookings).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(bookings.id, stale));
    expect(await expireStaleBookings()).toBe(1);
    const [expired] = await db.select().from(bookings).where(eq(bookings.id, stale));
    expect(expired.status).toBe("expired");
    await expect(respondToBooking(owner, stale, "accept")).rejects.toThrow(/déjà été traitée/);
  });

  it("messagerie : seuls les participants peuvent écrire", async () => {
    const owner = await makeUser("Owner");
    const renter = await makeUser("Renter");
    const stranger = await makeUser("Stranger");
    const listingId = await makeListing(owner);
    const conversationId = await getOrCreateConversation(listingId, renter);
    await expect(getOrCreateConversation(listingId, owner)).rejects.toThrow(/propre/);
    await sendMessage(renter, conversationId, "Bonjour !");
    await sendMessage(renter, conversationId, "Vous êtes là ?");
    await expect(sendMessage(stranger, conversationId, "Hello")).rejects.toThrow(/introuvable/);
    await expect(sendMessage(renter, conversationId, "   ")).rejects.toThrow(/vide/);
    // Une seule notification pour une rafale de messages non lus
    const notifs = await db.select().from(notifications).where(eq(notifications.userId, owner));
    expect(notifs).toHaveLength(1);
  });
});

describe("recherche", () => {
  it("filtre par texte sans accents, catégorie, commune et prix", async () => {
    const owner = await makeUser("Owner", "kourou");
    await makeListing(owner, { title: "Débroussailleuse Stihl", category: "jardin", commune: "kourou", dayPrice: "25" });
    await makeListing(owner, { title: "Groupe électrogène", category: "energie", commune: "matoury", dayPrice: "40" });
    expect((await searchListings({ q: "debroussailleuse" })).total).toBe(1);
    expect((await searchListings({ q: "ÉLECTROGÈNE" })).total).toBe(1);
    expect((await searchListings({ category: "jardin" })).total).toBe(1);
    expect((await searchListings({ commune: "matoury" })).total).toBe(1);
    expect((await searchListings({ maxPrice: 3000 })).total).toBe(1);
    const near = await searchListings({ near: { lat: 5.16, lng: -52.65 }, sort: "distance" });
    expect(near.items[0].title).toBe("Débroussailleuse Stihl");
    expect(near.items[0].distanceKm).toBeLessThan(2);
  });
});

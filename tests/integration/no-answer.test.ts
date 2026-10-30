// Fix 2 : relances et plan B quand le propriétaire ne répond pas.
import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { bookings, notifications, users } from "@/lib/db/schema";
import { addDays, todayInGuyane } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { alternativesFor, requestBooking, respondToBooking, sendRequestReminders } from "@/lib/services/bookings";
import { createListing, listingFormSchema } from "@/lib/services/listings";
import { getPublicProfile } from "@/lib/services/users";

let img: Buffer;
async function makeUser(name: string) {
  const id = newId();
  await db.insert(users).values({ id, email: `${id}@test.gf`, passwordHash: "x", name, commune: "cayenne", emailVerifiedAt: new Date() });
  return id;
}
async function makeListing(owner: string, title: string, category = "jardin", commune = "cayenne") {
  img ??= await sharp({ create: { width: 16, height: 16, channels: 3, background: "#0b6e4f" } }).png().toBuffer();
  return createListing(
    owner,
    listingFormSchema.parse({ title, description: "Matériel entretenu, révisé cette année, notice fournie.", category, condition: "bon", dayPrice: "20", deposit: "50", minDays: "1", commune }),
    [img],
  );
}
const day = (n: number) => addDays(todayInGuyane(), n);

beforeEach(async () => {
  await db.execute(sql`truncate users, images cascade`);
});
afterAll(closeDb);

describe("quand le propriétaire ne répond pas", () => {
  it("rappel unique au propriétaire dans les 12 dernières heures", async () => {
    const owner = await makeUser("Loueur distrait");
    const renter = await makeUser("Locataire pressé");
    const listingId = await makeListing(owner, "Débroussailleuse Stihl");
    const id = await requestBooking(renter, { listingId, startDate: day(5), endDate: day(6) });
    expect(await sendRequestReminders()).toBe(0); // expire dans 48 h : trop tôt
    await db.update(bookings).set({ expiresAt: new Date(Date.now() + 6 * 3_600_000) }).where(eq(bookings.id, id));
    expect(await sendRequestReminders()).toBe(1);
    expect(await sendRequestReminders()).toBe(0);
    const titles = (await db.select().from(notifications).where(eq(notifications.userId, owner))).map((n) => n.title);
    expect(titles.filter((t) => t.startsWith("Rappel"))).toHaveLength(1);
  });

  it("annonces de remplacement libres aux mêmes dates, même catégorie, hors l'annonce refusée", async () => {
    const owner = await makeUser("Loueur occupé");
    const other = await makeUser("Autre loueur");
    const renter = await makeUser("Locataire");
    const third = await makeUser("Troisième");
    const listingId = await makeListing(owner, "Tronçonneuse A");
    const free = await makeListing(other, "Tronçonneuse B");
    const busy = await makeListing(other, "Tronçonneuse C");
    await makeListing(other, "Nettoyeur haute pression", "nettoyage");
    const taken = await requestBooking(third, { listingId: busy, startDate: day(5), endDate: day(6) });
    await respondToBooking(other, taken, "accept");
    const id = await requestBooking(renter, { listingId, startDate: day(5), endDate: day(6) });
    await respondToBooking(owner, id, "decline");
    const alternatives = await alternativesFor(id);
    expect(alternatives.map((l) => l.id)).toEqual([free]);
  });

  it("délai de réponse habituel du propriétaire affiché sur son profil", async () => {
    const owner = await makeUser("Loueur rapide");
    const renter = await makeUser("Locataire");
    const listingId = await makeListing(owner, "Taille-haie");
    for (const [i, hours] of [3, 5, 30].entries()) {
      const id = await requestBooking(renter, { listingId, startDate: day(10 + i * 2), endDate: day(10 + i * 2) });
      await db.update(bookings).set({ createdAt: new Date(Date.now() - hours * 3_600_000) }).where(eq(bookings.id, id));
      await respondToBooking(owner, id, "decline");
    }
    const profile = await getPublicProfile(owner);
    expect(profile?.stats.typicalResponseHours).toBe(5);
  });
});

describe("petits correctifs (fix 4, 5, 6)", () => {
  it("fix 6 : délai minimum avant réservation imposé par le propriétaire", async () => {
    const owner = await makeUser("Loueur prévoyant");
    const renter = await makeUser("Locataire de dernière minute");
    img ??= await sharp({ create: { width: 16, height: 16, channels: 3, background: "#0b6e4f" } }).png().toBuffer();
    const listingId = await createListing(
      owner,
      listingFormSchema.parse({ title: "Échafaudage roulant", description: "Échafaudage 6 m, montage à deux, stabilisateurs fournis.", category: "construction", condition: "bon", dayPrice: "35", deposit: "300", minDays: "1", minNoticeDays: "4", commune: "cayenne" }),
      [img],
    );
    await expect(requestBooking(renter, { listingId, startDate: day(1), endDate: day(2) })).rejects.toThrow(/4 jours à l'avance/);
    await expect(requestBooking(renter, { listingId, startDate: day(4), endDate: day(5) })).resolves.toBeTruthy();
  });

  it("fix 5 : heures de remise et de retour enregistrées, format contrôlé", async () => {
    const owner = await makeUser("Loueur horaire");
    const renter = await makeUser("Locataire horaire");
    const listingId = await makeListing(owner, "Groupe électrogène");
    const id = await requestBooking(renter, { listingId, startDate: day(3), endDate: day(4), pickupTime: "07:30", returnTime: "18:00" });
    const [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b.pickupTime?.slice(0, 5)).toBe("07:30");
    expect(b.returnTime?.slice(0, 5)).toBe("18:00");
    await expect(requestBooking(renter, { listingId, startDate: day(8), endDate: day(8), pickupTime: "25:99" })).rejects.toThrow(/heure/i);
  });

  it("fix 4 : rayon en km autour d'une commune", async () => {
    const { searchListings } = await import("@/lib/services/listings");
    const owner = await makeUser("Loueur multi-communes");
    const marker = `rayon${Date.now()}`;
    const inCayenne = await makeListing(owner, `Karcher ${marker}`, "nettoyage", "cayenne");
    const inRemire = await makeListing(owner, `Karcher ${marker}`, "nettoyage", "remire-montjoly");
    const inKourou = await makeListing(owner, `Karcher ${marker}`, "nettoyage", "kourou");
    const only = await searchListings({ q: marker, commune: "cayenne" });
    expect(only.items.map((l) => l.id)).toEqual([inCayenne]);
    const around = await searchListings({ q: marker, commune: "cayenne", radiusKm: 20, sort: "distance" });
    expect(around.items.map((l) => l.id).sort()).toEqual([inCayenne, inRemire].sort());
    expect(around.items.map((l) => l.id)).not.toContain(inKourou);
  });
});

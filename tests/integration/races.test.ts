// Cas « deux onglets » / requêtes simultanées, impossibles à forcer depuis l'interface.
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { bookings, conversations, users } from "@/lib/db/schema";
import { addDays, todayInGuyane } from "@/lib/dates";
import { UserError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { cancelBooking, requestBooking, respondToBooking } from "@/lib/services/bookings";
import { createListing, listingFormSchema } from "@/lib/services/listings";

async function makeUser(name: string) {
  const id = newId();
  await db.insert(users).values({ id, email: `${id}@test.gf`, passwordHash: "x", name, commune: "cayenne", emailVerifiedAt: new Date() });
  return id;
}

async function makeListing(ownerId: string) {
  const photo = await sharp({ create: { width: 32, height: 24, channels: 3, background: "#0b6e4f" } }).png().toBuffer();
  const input = listingFormSchema.parse({
    title: "Perforateur SDS",
    description: "Perforateur 800 W avec forets béton de 6 à 12 mm.",
    category: "bricolage",
    condition: "bon",
    dayPrice: "12",
    deposit: "100",
    minDays: "1",
    commune: "cayenne",
  });
  return createListing(ownerId, input, [photo]);
}

const day = (n: number) => addDays(todayInGuyane(), n);

afterAll(closeDb);

describe("requêtes simultanées", () => {
  it("F01-E10 deux demandes identiques envoyées en même temps : une seule réservation", async () => {
    const owner = await makeUser("Loueur");
    const renter = await makeUser("Locataire");
    const listingId = await makeListing(owner);
    const req = { listingId, startDate: day(3), endDate: day(4) };
    await Promise.allSettled([requestBooking(renter, req), requestBooking(renter, req), requestBooking(renter, req)]);
    const rows = await db.select().from(bookings).where(eq(bookings.listingId, listingId));
    expect(rows).toHaveLength(1);
  });

  it("F01-E12 la base refuse une seconde demande en attente qui chevauche (BUG-006)", async () => {
    const owner = await makeUser("Loueur");
    const renter = await makeUser("Locataire");
    const listingId = await makeListing(owner);
    const id = await requestBooking(renter, { listingId, startDate: day(3), endDate: day(4) });
    const [first] = await db.select().from(bookings).where(eq(bookings.id, id));
    // Ce que ferait un second onglet arrivé entre le contrôle et l'insertion.
    await expect(db.insert(bookings).values({ ...first, id: newId(), startDate: day(4), endDate: day(5) })).rejects.toThrow();
  });

  it("F01-E13 la violation de contrainte devient un message clair", async () => {
    const { bookingConflictError } = await import("@/lib/services/bookings");
    const err = bookingConflictError(Object.assign(new Error("dup"), { code: "23P01", constraint_name: "bookings_one_pending_per_renter" }));
    expect(err).toBeInstanceOf(UserError);
    expect(err?.message).toMatch(/déjà une demande en attente/);
    expect(bookingConflictError(new Error("autre"))).toBeNull();
  });

  it("F01-E11 premier contact simultané : une seule conversation", async () => {
    const owner = await makeUser("Loueur");
    const a = await makeUser("Locataire");
    const listingId = await makeListing(owner);
    const results = await Promise.allSettled([
      requestBooking(a, { listingId, startDate: day(3), endDate: day(3) }),
      requestBooking(a, { listingId, startDate: day(6), endDate: day(6) }),
    ]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    const convs = await db.select().from(conversations).where(eq(conversations.listingId, listingId));
    expect(convs).toHaveLength(1);
  });

  it("F03-E5 accepter deux demandes qui se chevauchent en même temps : une seule acceptée", async () => {
    const owner = await makeUser("Loueur");
    const a = await makeUser("A");
    const b = await makeUser("B");
    const listingId = await makeListing(owner);
    const idA = await requestBooking(a, { listingId, startDate: day(4), endDate: day(6) });
    const idB = await requestBooking(b, { listingId, startDate: day(5), endDate: day(7) });
    const results = await Promise.allSettled([respondToBooking(owner, idA, "accept"), respondToBooking(owner, idB, "accept")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rows = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.listingId, listingId));
    expect(rows.filter((r) => r.status === "accepted")).toHaveLength(1);
  });

  it("F04-E3 accepter et annuler en même temps : état final cohérent", async () => {
    const owner = await makeUser("Loueur");
    const renter = await makeUser("Locataire");
    const listingId = await makeListing(owner);
    const id = await requestBooking(renter, { listingId, startDate: day(4), endDate: day(5) });
    await Promise.allSettled([respondToBooking(owner, id, "accept"), cancelBooking(renter, id, "changement")]);
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(["accepted", "cancelled"]).toContain(row.status);
  });
});

describe("classement par réactivité", () => {
  it("à la une, les annonces des loueurs qui répondent passent devant celles des loueurs qui laissent expirer", async () => {
    const { searchListings } = await import("@/lib/services/listings");
    const { expireStaleBookings } = await import("@/lib/services/bookings");
    const quick = await makeUser("Loueur réactif");
    const slow = await makeUser("Loueur absent");
    const renter = await makeUser("Locataire");
    const marker = `reac${Date.now()}`;
    const img = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#888" } }).png().toBuffer();
    const make = (owner: string) =>
      createListing(
        owner,
        listingFormSchema.parse({
          title: `Bétonnière ${marker}`,
          description: "Bétonnière 140 L, électrique, avec rallonge de 25 m.",
          category: "bricolage",
          condition: "bon",
          dayPrice: "25",
          deposit: "100",
          minDays: "1",
          commune: "cayenne",
        }),
        [img],
      );
    const quickListing = await make(quick);
    const slowListing = await make(slow); // plus récente : en tête du tri « récent »
    for (let i = 0; i < 3; i++) {
      const a = await requestBooking(renter, { listingId: quickListing, startDate: day(10 + i * 3), endDate: day(10 + i * 3) });
      await respondToBooking(quick, a, "decline");
      const b = await requestBooking(renter, { listingId: slowListing, startDate: day(10 + i * 3), endDate: day(10 + i * 3) });
      await db.update(bookings).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(bookings.id, b));
    }
    await expireStaleBookings();
    const recent = await searchListings({ q: marker, sort: "recent" });
    expect(recent.items.map((l) => l.id)).toEqual([slowListing, quickListing]);
    const recommended = await searchListings({ q: marker, sort: "recommended" });
    expect(recommended.items.map((l) => l.id)).toEqual([quickListing, slowListing]);
  });
});

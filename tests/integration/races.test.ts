// Cas « deux onglets » / requêtes simultanées, impossibles à forcer depuis l'interface.
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { bookings, conversations, users } from "@/lib/db/schema";
import { addDays, todayInGuyane } from "@/lib/dates";
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
    if (row.status === "cancelled") expect(row.handoverCode === null || row.cancelledAt !== null).toBe(true);
  });
});

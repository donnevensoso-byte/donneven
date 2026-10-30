import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { bookings, messages, notifications, reports, users } from "@/lib/db/schema";
import { addDays, todayInGuyane } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { confirmHandover, getBookingForAdmin, requestBooking, respondToBooking } from "@/lib/services/bookings";
import { createListing, listingFormSchema } from "@/lib/services/listings";
import { listReports, openDispute, openDisputeFor } from "@/lib/services/moderation";

async function makeUser(name: string) {
  const id = newId();
  await db.insert(users).values({ id, email: `${id}@test.gf`, passwordHash: "x", name, commune: "cayenne", emailVerifiedAt: new Date() });
  return id;
}

async function rental() {
  const owner = await makeUser("Loueur Litige");
  const renter = await makeUser("Locataire Litige");
  const photo = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#0b6e4f" } }).png().toBuffer();
  const listingId = await createListing(
    owner,
    listingFormSchema.parse({
      title: "Tronçonneuse thermique",
      description: "Tronçonneuse 45 cm, chaîne affûtée, mélange 2 % fourni.",
      category: "jardin",
      condition: "bon",
      dayPrice: "30",
      deposit: "250",
      minDays: "1",
      commune: "cayenne",
    }),
    [photo],
  );
  const id = await requestBooking(renter, { listingId, startDate: todayInGuyane(), endDate: addDays(todayInGuyane(), 1) });
  return { owner, renter, listingId, id };
}

beforeEach(async () => {
  await db.execute(sql`truncate users, images cascade`);
});
afterAll(closeDb);

describe("litige depuis la réservation", () => {
  it("le propriétaire déclare un litige : l'équipe le voit, le locataire est prévenu, la conversation en garde trace", async () => {
    const { owner, renter, id } = await rental();
    await respondToBooking(owner, id, "accept");
    const [{ handoverCode }] = await db.select().from(bookings).where(eq(bookings.id, id));
    await confirmHandover(owner, id, handoverCode!);

    await openDispute(owner, id, "Matériel endommagé", "Guide-chaîne tordu au retour.");
    const [report] = await db.select().from(reports).where(eq(reports.bookingId, id));
    expect(report).toMatchObject({ reporterId: owner, userId: renter, reason: "Matériel endommagé", status: "open" });
    expect((await openDisputeFor(id))?.reason).toBe("Matériel endommagé");
    const listed = await listReports();
    expect(listed[0].report.bookingId).toBe(id);

    const notes = await db.select().from(notifications).where(eq(notifications.userId, renter));
    expect(notes.some((n) => n.title.includes("Litige"))).toBe(true);
    const thread = await db.select().from(messages);
    expect(thread.some((m) => m.senderId === null && m.body.includes("Matériel endommagé"))).toBe(true);

    await expect(openDispute(renter, id, "Autre", "Je conteste.")).rejects.toThrow(/déjà ouvert/);
    expect((await getBookingForAdmin(id))?.booking.id).toBe(id);
  });

  it("refusé pour un tiers, pour une demande non acceptée, et pour un motif inconnu", async () => {
    const { owner, renter, id } = await rental();
    const stranger = await makeUser("Tiers");
    await expect(openDispute(renter, id, "Matériel endommagé")).rejects.toThrow(/après l'acceptation/);
    await respondToBooking(owner, id, "accept");
    await expect(openDispute(stranger, id, "Matériel endommagé")).rejects.toThrow(/introuvable/);
    await expect(openDispute(renter, id, "N'importe quoi")).rejects.toThrow(/motif/);
  });
});

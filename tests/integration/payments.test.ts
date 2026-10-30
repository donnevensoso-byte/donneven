import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { bookings, notifications, users } from "@/lib/db/schema";
import { addDays, todayInGuyane } from "@/lib/dates";
import { newId } from "@/lib/ids";
import {
  cancelBooking,
  expireStaleBookings,
  needsAuthorization,
  pendingRequestCount,
  requestBooking,
  respondToBooking,
} from "@/lib/services/bookings";
import { createListing, listingFormSchema } from "@/lib/services/listings";
import { setPaymentGateway, type CheckoutState, type PaymentGateway } from "@/lib/services/payment-gateway";
import { createAuthorizationCheckout, processStripeEvent, syncCheckoutSession } from "@/lib/services/payments";

// Stripe simulé : enregistre les appels et l'état des empreintes.
class FakeGateway implements PaymentGateway {
  calls: string[] = [];
  sessions = new Map<string, CheckoutState>();
  failCapture = false;
  async createAuthorization(p: { bookingId: string; applicationFee: number; lines: { amount: number }[] }) {
    const id = `cs_${p.bookingId}`;
    this.sessions.set(id, { bookingId: p.bookingId, paymentIntentId: `pi_${p.bookingId}`, state: "open" });
    this.calls.push(`authorize:${p.bookingId}:${p.lines.reduce((s, l) => s + l.amount, 0)}:${p.applicationFee}`);
    return { id, url: `https://checkout.test/${id}` };
  }
  async getCheckout(id: string) {
    return this.sessions.get(id)!;
  }
  async capture(pi: string) {
    if (this.failCapture) throw new Error("card_declined");
    this.calls.push(`capture:${pi}`);
  }
  async release(pi: string) {
    this.calls.push(`release:${pi}`);
  }
  async refund(pi: string) {
    this.calls.push(`refund:${pi}`);
  }
  /** Le locataire valide l'empreinte sur la page de paiement. */
  authorize(bookingId: string) {
    this.sessions.set(`cs_${bookingId}`, { bookingId, paymentIntentId: `pi_${bookingId}`, state: "authorized" });
  }
}

const today = todayInGuyane();
let gateway: FakeGateway;
let photo: Buffer;

async function makeUser(name: string, onboarded = false) {
  const id = newId();
  await db.insert(users).values({
    id, email: `${id}@test.gf`, passwordHash: "x", name, commune: "cayenne", emailVerifiedAt: new Date(),
    stripeOnboarded: onboarded, stripeAccountId: onboarded ? `acct_${id}` : null,
  });
  return id;
}

async function makeListing(ownerId: string) {
  photo ??= await sharp({ create: { width: 32, height: 24, channels: 3, background: "#0b6e4f" } }).png().toBuffer();
  const input = listingFormSchema.parse({
    title: "Groupe électrogène", description: "Groupe inverter 3000 W, rendu avec le plein.", category: "energie",
    condition: "bon", dayPrice: "40", deposit: "300", minDays: "1", commune: "kourou",
  });
  return createListing(ownerId, input, [photo]);
}

/** Demande en ligne avec empreinte validée. */
async function authorizedRequest(renter: string, listingId: string, start: number, end: number) {
  const id = await requestBooking(renter, { listingId, startDate: addDays(today, start), endDate: addDays(today, end) });
  await createAuthorizationCheckout(renter, id);
  gateway.authorize(id);
  await syncCheckoutSession(`cs_${id}`);
  return id;
}

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_simule";
  process.env.SERVICE_FEE_PERCENT = "10";
});
afterAll(async () => {
  delete process.env.STRIPE_SECRET_KEY;
  setPaymentGateway(null);
  await closeDb();
});
beforeEach(async () => {
  await db.execute(sql`truncate users, images, stripe_events cascade`);
  gateway = new FakeGateway();
  setPaymentGateway(gateway);
});
afterEach(() => setPaymentGateway(null));

describe("paiement en ligne avec empreinte bancaire", () => {
  it("empreinte à la demande, débit à l'acceptation, remboursement à l'annulation", async () => {
    const owner = await makeUser("Jean B.", true);
    const renter = await makeUser("Yannick L.");
    const listingId = await makeListing(owner);

    const id = await requestBooking(renter, { listingId, startDate: addDays(today, 2), endDate: addDays(today, 3) });
    let [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b).toMatchObject({ paymentMethod: "online", paymentStatus: "none", rentalAmount: 8000, serviceFee: 800 });
    expect(await needsAuthorization(id)).toBe(true);
    // Rien n'est envoyé au propriétaire tant que l'empreinte n'est pas posée
    expect(await db.select().from(notifications).where(eq(notifications.userId, owner))).toHaveLength(0);
    expect(await pendingRequestCount(owner)).toBe(0);
    await expect(respondToBooking(owner, id, "accept")).rejects.toThrow(/empreinte/);

    await createAuthorizationCheckout(renter, id);
    expect(gateway.calls).toEqual([`authorize:${id}:8800:800`]);
    await syncCheckoutSession(`cs_${id}`); // page de paiement abandonnée
    expect(await needsAuthorization(id)).toBe(true);
    gateway.authorize(id);
    await syncCheckoutSession(`cs_${id}`);
    [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b).toMatchObject({ paymentStatus: "authorized", stripePaymentIntentId: `pi_${id}` });
    expect((await db.select().from(notifications).where(eq(notifications.userId, owner))).map((n) => n.title)).toEqual([
      "Nouvelle demande de réservation",
    ]);
    expect(await pendingRequestCount(owner)).toBe(1);

    await respondToBooking(owner, id, "accept");
    [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b).toMatchObject({ status: "accepted", paymentStatus: "paid" });
    expect(gateway.calls).toContain(`capture:pi_${id}`);

    await cancelBooking(owner, id, "Panne");
    [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });
    expect(gateway.calls.at(-1)).toBe(`refund:pi_${id}`);
  });

  it("libère l'empreinte au refus, à l'expiration, à l'annulation et au refus automatique", async () => {
    const owner = await makeUser("Aline T.", true);
    const renter = await makeUser("Paul R.");
    const other = await makeUser("Sandra P.");
    const listingId = await makeListing(owner);

    const declined = await authorizedRequest(renter, listingId, 2, 2);
    await respondToBooking(owner, declined, "decline", "Indisponible");
    expect(gateway.calls).toContain(`release:pi_${declined}`);

    const cancelled = await authorizedRequest(renter, listingId, 4, 4);
    await cancelBooking(renter, cancelled);
    expect(gateway.calls).toContain(`release:pi_${cancelled}`);

    const stale = await authorizedRequest(renter, listingId, 6, 6);
    await db.update(bookings).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(bookings.id, stale));
    await expireStaleBookings();
    expect(gateway.calls).toContain(`release:pi_${stale}`);

    const winner = await authorizedRequest(renter, listingId, 10, 12);
    const loser = await authorizedRequest(other, listingId, 11, 13);
    await respondToBooking(owner, winner, "accept");
    expect(gateway.calls).toContain(`release:pi_${loser}`);
    const [l] = await db.select().from(bookings).where(eq(bookings.id, loser));
    expect(l).toMatchObject({ status: "declined", paymentStatus: "none" });
  });

  it("si le débit échoue, la demande reste en attente", async () => {
    const owner = await makeUser("Kévin H.", true);
    const renter = await makeUser("Marie D.");
    const listingId = await makeListing(owner);
    const id = await authorizedRequest(renter, listingId, 2, 3);
    gateway.failCapture = true;
    await expect(respondToBooking(owner, id, "accept")).rejects.toThrow(/débité/);
    const [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b).toMatchObject({ status: "pending", paymentStatus: "authorized", handoverCode: null });
  });

  it("chaque événement Stripe n'est traité qu'une fois", async () => {
    const owner = await makeUser("Owner webhook", true);
    const renter = await makeUser("Renter webhook");
    const listingId = await makeListing(owner);
    const id = await requestBooking(renter, { listingId, startDate: addDays(today, 2), endDate: addDays(today, 2) });
    await createAuthorizationCheckout(renter, id);
    gateway.authorize(id);
    const event = { id: "evt_1", type: "checkout.session.completed", data: { object: { id: `cs_${id}` } } };
    expect(await processStripeEvent(event)).toBe(true);
    expect(await processStripeEvent(event)).toBe(false);
    const ownerNotices = await db.select().from(notifications).where(eq(notifications.userId, owner));
    expect(ownerNotices).toHaveLength(1);
  });

  it("sans compte Stripe du propriétaire, paiement en main propre sans frais", async () => {
    const owner = await makeUser("Owner sur place");
    const renter = await makeUser("Renter sur place");
    const listingId = await makeListing(owner);
    const id = await requestBooking(renter, { listingId, startDate: addDays(today, 2), endDate: addDays(today, 2) });
    const [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    expect(b).toMatchObject({ paymentMethod: "onsite", serviceFee: 0 });
    expect(await needsAuthorization(id)).toBe(false);
    await respondToBooking(owner, id, "accept");
    expect(gateway.calls).toEqual([]);
  });
});

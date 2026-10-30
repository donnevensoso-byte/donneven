// Paiement en ligne facultatif via Stripe Connect (comptes Express).
// Empreinte bancaire à la demande, débit quand le propriétaire accepte ;
// Stripe reverse la location au propriétaire, la plateforme garde les frais de service.
import { and, desc, eq, inArray } from "drizzle-orm";
import { APP_NAME, appUrl, stripeEnabled } from "../config";
import { db } from "../db";
import { bookings, listings, stripeEvents, users } from "../db/schema";
import { UserError } from "../errors";
import { markBookingAuthorized, markBookingPaid } from "./bookings";
import { getStripe, paymentGateway, type CheckoutLine, type CheckoutState } from "./payment-gateway";

/** Lien d'inscription Stripe pour qu'un propriétaire reçoive ses paiements. */
export async function createOnboardingLink(userId: string): Promise<string> {
  const stripe = getStripe();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new UserError("Compte introuvable.");
  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: user.email,
      business_type: "individual",
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: {
        product_description: `Location de matériel entre particuliers sur ${APP_NAME}`,
        url: appUrl().startsWith("https://") ? `${appUrl()}/profil/${user.id}` : undefined,
      },
      metadata: { userId: user.id },
    });
    accountId = account.id;
    await db.update(users).set({ stripeAccountId: accountId }).where(eq(users.id, userId));
  }
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appUrl()}/compte/paiements?refresh=1`,
    return_url: `${appUrl()}/compte/paiements?retour=1`,
  });
  return link.url;
}

export async function refreshOnboardingStatus(userId: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.stripeAccountId || !stripeEnabled()) return false;
  const account = await getStripe().accounts.retrieve(user.stripeAccountId);
  const ready = Boolean(account.charges_enabled && account.payouts_enabled);
  if (ready !== user.stripeOnboarded) {
    await db.update(users).set({ stripeOnboarded: ready }).where(eq(users.id, userId));
  }
  return ready;
}

export async function createDashboardLink(userId: string): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.stripeAccountId) throw new UserError("Aucun compte de paiement.");
  const link = await getStripe().accounts.createLoginLink(user.stripeAccountId);
  return link.url;
}

/**
 * Page de paiement Stripe qui pose une empreinte bancaire sur la carte du locataire
 * juste après sa demande. Le débit n'a lieu que si le propriétaire accepte.
 */
export async function createAuthorizationCheckout(renterId: string, bookingId: string): Promise<string> {
  const [row] = await db
    .select({ booking: bookings, title: listings.title, ownerAccount: users.stripeAccountId })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .innerJoin(users, eq(users.id, bookings.ownerId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row || row.booking.renterId !== renterId) throw new UserError("Réservation introuvable.");
  const { booking } = row;
  if (booking.status !== "pending" || booking.paymentMethod !== "online" || booking.paymentStatus !== "none") {
    throw new UserError("Aucune empreinte bancaire à valider pour cette réservation.");
  }
  if (!row.ownerAccount) throw new UserError("Le propriétaire ne peut pas encore recevoir de paiement.");
  const [renter] = await db.select({ email: users.email }).from(users).where(eq(users.id, renterId)).limit(1);

  const lines: CheckoutLine[] = [
    { name: `Location : ${row.title}`, description: `${booking.days} jour(s), du ${booking.startDate} au ${booking.endDate}`, amount: booking.rentalAmount },
  ];
  if (booking.serviceFee > 0) lines.push({ name: `Frais de service ${APP_NAME}`, amount: booking.serviceFee });
  const session = await paymentGateway().createAuthorization({
    bookingId: booking.id,
    customerEmail: renter?.email,
    lines,
    successUrl: `${appUrl()}/reservations/${booking.id}?paiement={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl()}/reservations/${booking.id}`,
  });
  await db.update(bookings).set({ stripeCheckoutSessionId: session.id }).where(eq(bookings.id, booking.id));
  return session.url;
}

export type PayoutState = "awaiting_handover" | "pending" | "paid_out" | "refunded";

/** Locations payées en ligne d'un propriétaire, avec l'état de leur versement. */
export async function ownerPayouts(ownerId: string) {
  const rows = await db
    .select({ booking: bookings, title: listings.title })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .where(and(eq(bookings.ownerId, ownerId), eq(bookings.paymentMethod, "online"), inArray(bookings.paymentStatus, ["paid", "refunded"])))
    .orderBy(desc(bookings.startDate))
    .limit(100);
  return rows.map(({ booking, title }) => {
    const state: PayoutState =
      booking.paymentStatus === "refunded" ? "refunded" : booking.paidOutAt ? "paid_out" : booking.status === "accepted" ? "awaiting_handover" : "pending";
    return { bookingId: booking.id, title, startDate: booking.startDate, endDate: booking.endDate, amount: booking.rentalAmount, paidOutAt: booking.paidOutAt, state };
  });
}

/** Vérifie une session au retour du locataire (filet de sécurité si le webhook tarde). */
export async function syncCheckoutSession(sessionId: string): Promise<void> {
  await applyCheckout(await paymentGateway().getCheckout(sessionId));
}

async function applyCheckout(checkout: CheckoutState) {
  if (!checkout.bookingId || !checkout.paymentIntentId) return;
  if (checkout.state === "authorized") await markBookingAuthorized(checkout.bookingId, checkout.paymentIntentId);
  // Réservations créées avant l'empreinte (paiement après acceptation).
  if (checkout.state === "paid") await markBookingPaid(checkout.bookingId, checkout.paymentIntentId);
}

/** Événement Stripe minimal, tel que traité ici (testable sans Stripe). */
export type StripeEventLike = {
  id: string;
  type: string;
  data: { object: { id: string; charges_enabled?: boolean; payouts_enabled?: boolean } };
};

/** Traite un événement une seule fois : Stripe peut renvoyer le même événement. */
export async function processStripeEvent(event: StripeEventLike): Promise<boolean> {
  const [fresh] = await db.insert(stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning();
  if (!fresh) return false;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await syncCheckoutSession(event.data.object.id);
      break;
    case "account.updated": {
      const account = event.data.object;
      const ready = Boolean(account.charges_enabled && account.payouts_enabled);
      await db.update(users).set({ stripeOnboarded: ready }).where(eq(users.stripeAccountId, account.id));
      break;
    }
  }
  return true;
}

export async function handleStripeWebhook(rawBody: string, signature: string | null): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) throw new UserError("Webhook non configuré.");
  const event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  await processStripeEvent(event as unknown as StripeEventLike);
}

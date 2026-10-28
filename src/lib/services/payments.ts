// Paiement en ligne facultatif via Stripe Connect (comptes Express).
// Le locataire paie la location + les frais de service ; Stripe reverse la
// location au propriétaire et la plateforme conserve les frais de service.
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { APP_NAME, appUrl, stripeEnabled } from "../config";
import { db } from "../db";
import { bookings, listings, users } from "../db/schema";
import { UserError } from "../errors";
import { markBookingPaid } from "./bookings";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeEnabled()) throw new UserError("Le paiement en ligne n'est pas activé.");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, { appInfo: { name: APP_NAME } });
  return client;
}

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

/** Crée la page de paiement Stripe pour une réservation acceptée. */
export async function createCheckout(renterId: string, bookingId: string): Promise<string> {
  const stripe = getStripe();
  const [row] = await db
    .select({ booking: bookings, title: listings.title, ownerAccount: users.stripeAccountId })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .innerJoin(users, eq(users.id, bookings.ownerId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row || row.booking.renterId !== renterId) throw new UserError("Réservation introuvable.");
  const { booking } = row;
  if (booking.status !== "accepted" || booking.paymentMethod !== "online") throw new UserError("Aucun paiement en attente.");
  if (booking.paymentStatus === "paid") throw new UserError("Cette réservation est déjà payée.");
  if (!row.ownerAccount) throw new UserError("Le propriétaire ne peut pas encore recevoir de paiement.");
  const [renter] = await db.select({ email: users.email }).from(users).where(eq(users.id, renterId)).limit(1);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: booking.rentalAmount,
        product_data: { name: `Location : ${row.title}`, description: `${booking.days} jour(s), du ${booking.startDate} au ${booking.endDate}` },
      },
    },
  ];
  if (booking.serviceFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "eur", unit_amount: booking.serviceFee, product_data: { name: `Frais de service ${APP_NAME}` } },
    });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    customer_email: renter?.email,
    line_items: lineItems,
    payment_intent_data: {
      application_fee_amount: booking.serviceFee,
      transfer_data: { destination: row.ownerAccount },
      metadata: { bookingId: booking.id },
      description: `${APP_NAME} – réservation ${booking.id}`,
    },
    metadata: { bookingId: booking.id },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${appUrl()}/reservations/${booking.id}?paiement={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/reservations/${booking.id}`,
  });
  await db.update(bookings).set({ stripeCheckoutSessionId: session.id }).where(eq(bookings.id, booking.id));
  if (!session.url) throw new UserError("Impossible d'ouvrir la page de paiement.");
  return session.url;
}

/** Vérifie une session de paiement au retour du locataire (filet de sécurité du webhook). */
export async function syncCheckoutSession(sessionId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  await applyCheckoutSession(session);
}

async function applyCheckoutSession(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId || session.payment_status !== "paid") return;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  await markBookingPaid(bookingId, paymentIntent);
}

export async function handleStripeWebhook(rawBody: string, signature: string | null): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) throw new UserError("Webhook non configuré.");
  const event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await applyCheckoutSession(event.data.object);
      break;
    case "account.updated": {
      const account = event.data.object;
      const ready = Boolean(account.charges_enabled && account.payouts_enabled);
      await db.update(users).set({ stripeOnboarded: ready }).where(eq(users.stripeAccountId, account.id));
      break;
    }
  }
}

export async function refundPayment(paymentIntentId: string): Promise<void> {
  await getStripe().refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}

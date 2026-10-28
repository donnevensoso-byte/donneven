import "server-only";
import Stripe from "stripe";

/** Stripe est activé dès qu'une clé secrète est fournie ; sinon l'app tourne en mode démo. */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe n'est pas configuré");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function createCheckout(booking: { id: string; total: number; label: string; email: string }) {
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: booking.email,
    locale: "fr",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: booking.total,
          product_data: { name: booking.label },
        },
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${appUrl()}/reservations/${booking.id}?paiement=ok`,
    cancel_url: `${appUrl()}/reservations/${booking.id}?paiement=annule`,
  });
  return session;
}

export async function refund(paymentRef: string | null, amount: number) {
  if (!stripeEnabled() || !paymentRef || amount <= 0) return;
  const session = await stripe().checkout.sessions.retrieve(paymentRef);
  if (typeof session.payment_intent === "string") {
    await stripe().refunds.create({ payment_intent: session.payment_intent, amount });
  }
}

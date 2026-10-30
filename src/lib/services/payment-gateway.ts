// Passerelle de paiement : Stripe en production, remplaçable dans les tests.
// Seules les opérations dont la logique de réservation a besoin sont exposées.
import Stripe from "stripe";
import { APP_NAME, stripeEnabled } from "../config";
import { UserError } from "../errors";

export type CheckoutLine = { name: string; description?: string; amount: number };

export type AuthorizationParams = {
  bookingId: string;
  customerEmail?: string;
  lines: CheckoutLine[];
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutState = {
  bookingId: string | null;
  paymentIntentId: string | null;
  /** authorized = empreinte posée (capture manuelle), paid = débité. */
  state: "open" | "authorized" | "paid" | "expired";
};

export interface PaymentGateway {
  /** Page de paiement qui pose une empreinte sans débiter (capture manuelle). */
  createAuthorization(params: AuthorizationParams): Promise<{ id: string; url: string }>;
  getCheckout(sessionId: string): Promise<CheckoutState>;
  /** Débite l'empreinte (à l'acceptation du propriétaire). */
  capture(paymentIntentId: string): Promise<void>;
  /** Libère l'empreinte sans débit (refus, expiration, annulation avant acceptation). */
  release(paymentIntentId: string): Promise<void>;
  /** Rembourse un paiement débité, frais de service compris (toujours avant tout versement). */
  refund(paymentIntentId: string): Promise<void>;
  /** Verse la location au propriétaire depuis le paiement débité. Rejouable sans double versement. */
  transfer(params: TransferParams): Promise<string>;
}

export type TransferParams = { paymentIntentId: string; destinationAccount: string; amount: number; bookingId: string };

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeEnabled()) throw new UserError("Le paiement en ligne n'est pas activé.");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, { appInfo: { name: APP_NAME } });
  return client;
}

const stripeGateway: PaymentGateway = {
  async createAuthorization(p) {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      customer_email: p.customerEmail,
      line_items: p.lines.map((line) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: line.amount,
          product_data: { name: line.name, ...(line.description ? { description: line.description } : {}) },
        },
      })),
      // Charges et virements séparés : l'argent reste chez Zouti jusqu'à la remise,
      // puis la location part chez le propriétaire (transfer) ; les frais restent à Zouti.
      payment_intent_data: {
        capture_method: "manual",
        transfer_group: p.bookingId,
        metadata: { bookingId: p.bookingId },
        description: `${APP_NAME} – réservation ${p.bookingId}`,
      },
      metadata: { bookingId: p.bookingId },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
    });
    if (!session.url) throw new UserError("Impossible d'ouvrir la page de paiement.");
    return { id: session.id, url: session.url };
  },

  async getCheckout(sessionId) {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
    const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
    const state: CheckoutState["state"] =
      intent?.status === "requires_capture"
        ? "authorized"
        : intent?.status === "succeeded"
          ? "paid"
          : session.status === "expired"
            ? "expired"
            : "open";
    return {
      bookingId: session.metadata?.bookingId ?? null,
      paymentIntentId: intent?.id ?? (typeof session.payment_intent === "string" ? session.payment_intent : null),
      state,
    };
  },

  async capture(paymentIntentId) {
    await getStripe().paymentIntents.capture(paymentIntentId);
  },

  async release(paymentIntentId) {
    await getStripe().paymentIntents.cancel(paymentIntentId);
  },

  async refund(paymentIntentId) {
    await getStripe().refunds.create({ payment_intent: paymentIntentId });
  },

  async transfer(p) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(p.paymentIntentId);
    const charge = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
    if (!charge) throw new Error(`Aucun débit pour ${p.paymentIntentId}`);
    const transfer = await stripe.transfers.create(
      {
        amount: p.amount,
        currency: "eur",
        destination: p.destinationAccount,
        transfer_group: p.bookingId,
        source_transaction: charge,
        metadata: { bookingId: p.bookingId },
      },
      { idempotencyKey: `payout-${p.bookingId}` },
    );
    return transfer.id;
  },
};

let override: PaymentGateway | null = null;

/** Remplace Stripe (tests). Passer null pour revenir à Stripe. */
export function setPaymentGateway(gateway: PaymentGateway | null): void {
  override = gateway;
}

export function paymentGateway(): PaymentGateway {
  return override ?? stripeGateway;
}

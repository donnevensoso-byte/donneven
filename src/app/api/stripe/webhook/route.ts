import { stripeEnabled } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!stripeEnabled()) return new Response("Stripe désactivé", { status: 404 });
  const { handleStripeWebhook } = await import("@/lib/services/payments");
  try {
    await handleStripeWebhook(await request.text(), request.headers.get("stripe-signature"));
  } catch (err) {
    console.error("Webhook Stripe refusé", err);
    return new Response("Signature invalide", { status: 400 });
  }
  return Response.json({ received: true });
}

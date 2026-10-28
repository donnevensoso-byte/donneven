import { stripe, stripeEnabled } from "@/lib/payments";
import { markBookingPaid } from "@/lib/bookings";

export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) return new Response("Stripe désactivé", { status: 404 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Signature manquante", { status: 400 });
  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    if (bookingId && session.payment_status === "paid") await markBookingPaid(bookingId, session.id);
  }
  return Response.json({ received: true });
}

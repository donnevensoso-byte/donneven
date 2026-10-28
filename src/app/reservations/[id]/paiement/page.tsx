import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadBookingFor } from "@/lib/bookings";
import { stripeEnabled } from "@/lib/payments";
import { euros, vehicleName } from "@/lib/format";
import { confirmDemoPayment } from "@/app/actions/bookings";
import { PriceDetails } from "@/components/PriceDetails";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Paiement" };

/** Paiement simulé utilisé lorsque Stripe n'est pas configuré (démo / développement). */
export default async function DemoPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/reservations/${id}/paiement`);
  const ctx = await loadBookingFor(id, user.id);
  if (!ctx || ctx.role !== "RENTER") notFound();
  if (stripeEnabled() || ctx.booking.status !== "AWAITING_PAYMENT") redirect(`/reservations/${id}`);
  const b = ctx.booking;

  return (
    <div className="container-app max-w-lg py-10">
      <h1 className="heading text-2xl">Paiement sécurisé</h1>
      <p className="mt-1 text-slate-600">{vehicleName(b.vehicle)} · {b.days} jour(s)</p>
      <div className="card mt-6 p-5">
        <PriceDetails p={b} plan={b.insurancePlan} />
      </div>
      <form action={confirmDemoPayment.bind(null, b.id)} className="card mt-4 space-y-4 p-5">
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Mode démonstration : aucune carte n&apos;est débitée. Configurez <code>STRIPE_SECRET_KEY</code> pour activer le vrai paiement.
        </p>
        <label className="block">
          <span className="label">Numéro de carte</span>
          <input className="input" inputMode="numeric" defaultValue="4242 4242 4242 4242" autoComplete="off" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="label">Expiration</span><input className="input" defaultValue="12/29" autoComplete="off" /></label>
          <label><span className="label">CVC</span><input className="input" defaultValue="123" autoComplete="off" /></label>
        </div>
        <SubmitButton className="btn-accent w-full py-3 text-base" pendingLabel="Paiement en cours…">Payer {euros(b.total)}</SubmitButton>
      </form>
    </div>
  );
}

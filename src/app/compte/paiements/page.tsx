import type { Metadata } from "next";
import Link from "next/link";
import { StripeButtons } from "@/components/account-forms";
import { Alert, Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { serviceFeePercent, stripeEnabled } from "@/lib/config";
import { formatDateRange, formatDateTime } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { ownerPayouts, type PayoutState } from "@/lib/services/payments";

const PAYOUT_LABELS: Record<PayoutState, { label: string; tone: "green" | "neutral" | "yellow" }> = {
  awaiting_handover: { label: "Versé à la remise", tone: "neutral" },
  pending: { label: "Versement en cours", tone: "yellow" },
  paid_out: { label: "Versé", tone: "green" },
  refunded: { label: "Remboursé au locataire", tone: "neutral" },
};

export const metadata: Metadata = { title: "Paiements en ligne" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ retour?: string }> }) {
  const { retour } = await searchParams;
  const user = await requireUser("/compte/paiements");
  let onboarded = user.stripeOnboarded;
  if (stripeEnabled() && user.stripeAccountId && !onboarded) {
    const { refreshOnboardingStatus } = await import("@/lib/services/payments");
    onboarded = await refreshOnboardingStatus(user.id).catch(() => false);
  }
  const payouts = await ownerPayouts(user.id);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Paiements en ligne" subtitle={<Link href="/compte" className="text-brand-600 hover:underline">← Mon compte</Link>} />
      {!stripeEnabled() ? (
        <Alert tone="info">Le paiement en ligne n&apos;est pas encore activé sur Zouti : les locations se règlent en main propre.</Alert>
      ) : (
        <div className="card space-y-4 p-5 sm:p-6">
          {retour && !onboarded && <Alert tone="warning">Votre inscription n&apos;est pas terminée : quelques informations manquent encore.</Alert>}
          {onboarded ? (
            <Alert tone="success">✅ Vos annonces acceptent le paiement par carte. Les versements arrivent sur votre compte bancaire.</Alert>
          ) : (
            <p className="text-sm">
              Activez le paiement par carte : vos locataires posent une empreinte bancaire avec leur demande, sont débités quand vous acceptez, et vous recevez la location
              sur votre compte bancaire dès la remise du matériel (via notre partenaire Stripe). Les frais de service ({serviceFeePercent()} %) sont payés par le locataire.
            </p>
          )}
          <StripeButtons onboarded={onboarded} hasAccount={Boolean(user.stripeAccountId)} />
        </div>
      )}
      {payouts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Vos versements</h2>
          <p className="mt-1 text-sm text-muted">La location vous est versée dès que vous confirmez la remise avec le code du locataire.</p>
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {payouts.map((p) => (
              <li key={p.bookingId} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <Link href={`/reservations/${p.bookingId}`} className="font-medium hover:underline">{p.title}</Link>
                  <p className="text-muted">
                    {formatDateRange(p.startDate, p.endDate)}
                    {p.paidOutAt && ` · versé le ${formatDateTime(p.paidOutAt)}`}
                  </p>
                </div>
                <span className="font-semibold">{formatEuros(p.amount)}</span>
                <Badge tone={PAYOUT_LABELS[p.state].tone}>{PAYOUT_LABELS[p.state].label}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

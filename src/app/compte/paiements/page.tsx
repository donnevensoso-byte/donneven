import type { Metadata } from "next";
import Link from "next/link";
import { StripeButtons } from "@/components/account-forms";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { serviceFeePercent, stripeEnabled } from "@/lib/config";

export const metadata: Metadata = { title: "Paiements en ligne" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ retour?: string }> }) {
  const { retour } = await searchParams;
  const user = await requireUser("/compte/paiements");
  let onboarded = user.stripeOnboarded;
  if (stripeEnabled() && user.stripeAccountId && !onboarded) {
    const { refreshOnboardingStatus } = await import("@/lib/services/payments");
    onboarded = await refreshOnboardingStatus(user.id).catch(() => false);
  }
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
              Activez le paiement par carte : vos locataires paient en ligne à la confirmation, et vous recevez la location sur
              votre compte bancaire (via notre partenaire Stripe). Les frais de service ({serviceFeePercent()} %) sont payés par le locataire.
            </p>
          )}
          <StripeButtons onboarded={onboarded} hasAccount={Boolean(user.stripeAccountId)} />
        </div>
      )}
    </div>
  );
}

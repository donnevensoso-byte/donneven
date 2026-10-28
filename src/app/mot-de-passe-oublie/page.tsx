import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indiquez votre adresse : nous vous envoyons un lien pour en choisir un nouveau."
      footer={<Link href="/connexion" className="font-semibold text-brand-600 hover:underline">Retour à la connexion</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

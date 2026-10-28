import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  if (await getCurrentUser()) redirect(suite?.startsWith("/") ? suite : "/");
  return (
    <div className="container-app max-w-md py-12">
      <h1 className="heading text-3xl">Bon retour ! 👋</h1>
      <p className="mt-1 text-slate-600">Connectez-vous pour réserver ou gérer vos véhicules.</p>
      <div className="card mt-6 p-6">
        <LoginForm suite={suite} />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Pas encore de compte ?{" "}
        <Link href={`/inscription${suite ? `?suite=${encodeURIComponent(suite)}` : ""}`} className="font-semibold text-lagon-700">Inscrivez-vous</Link>
      </p>
      <p className="mt-6 rounded-xl bg-lagon-50 p-4 text-xs text-lagon-900">
        Démo : <strong>locataire@woule.test</strong>, <strong>proprio@woule.test</strong> ou <strong>admin@woule.test</strong> — mot de passe <strong>woule2026</strong>
      </p>
    </div>
  );
}

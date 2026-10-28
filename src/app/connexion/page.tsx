import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/text";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeRedirectPath(next));
  return (
    <AuthShell
      title="Bon retour !"
      subtitle="Connectez-vous pour réserver ou gérer vos annonces."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-600 hover:underline">
            Inscrivez-vous gratuitement
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}

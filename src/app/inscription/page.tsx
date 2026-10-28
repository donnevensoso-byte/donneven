import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { CommuneOptions } from "@/components/commune-select";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Inscription" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/compte");
  return (
    <AuthShell
      title="Rejoindre Zouti"
      subtitle="Gratuit, en 30 secondes. Louez ou proposez du matériel partout en Guyane."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href={`/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-600 hover:underline">
            Connectez-vous
          </Link>
        </>
      }
    >
      <SignupForm next={next} communeOptions={<CommuneOptions />} />
    </AuthShell>
  );
}

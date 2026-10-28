import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <div className="container-app max-w-lg py-12">
      <h1 className="heading text-3xl">Rejoignez Woulé 🌴</h1>
      <p className="mt-1 text-slate-600">Un seul compte pour louer et pour mettre votre véhicule en location.</p>
      <div className="card mt-6 p-6">
        <RegisterForm suite={suite} />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Déjà inscrit ? <Link href="/connexion" className="font-semibold text-lagon-700">Connectez-vous</Link>
      </p>
    </div>
  );
}

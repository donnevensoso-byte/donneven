import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { userRating } from "@/lib/queries";
import { getTerritory } from "@/lib/territories";
import { formatDate } from "@/lib/dates";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { LicenseForm } from "@/components/forms/LicenseForm";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Mon profil" };

const LICENSE: Record<string, { label: string; cls: string }> = {
  NONE: { label: "Non renseigné", cls: "bg-slate-100 text-slate-700" },
  PENDING: { label: "En cours de vérification", cls: "bg-amber-100 text-amber-800" },
  VERIFIED: { label: "Vérifié", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Refusé — renvoyez une photo lisible", cls: "bg-red-100 text-red-700" },
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const user = await requireUser("/compte");
  const { bienvenue } = await searchParams;
  const rating = await userRating(user.id);
  const license = LICENSE[user.licenseStatus] ?? LICENSE.NONE;

  return (
    <div className="container-app max-w-3xl space-y-6 py-8">
      {bienvenue && (
        <p className="rounded-2xl bg-lagon-600 p-5 text-white">
          <strong>Byenvini, {user.firstName} !</strong> Dernière étape avant de woulé : ajoutez votre permis de conduire ci-dessous.
        </p>
      )}
      <div className="flex items-center gap-4">
        <Avatar user={user} size={72} />
        <div>
          <h1 className="heading text-2xl">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-slate-500">{getTerritory(user.territory).name} · membre depuis le {formatDate(user.createdAt)}</p>
          <Stars value={rating.avg} count={rating.count} />
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/compte/locations" className="card p-4 text-sm font-semibold hover:shadow-md">🚗 Mes locations</Link>
        <Link href="/compte/favoris" className="card p-4 text-sm font-semibold hover:shadow-md">❤️ Favoris</Link>
        <Link href="/proprietaire" className="card p-4 text-sm font-semibold hover:shadow-md">🔑 Espace propriétaire</Link>
        <Link href={`/utilisateurs/${user.id}`} className="card p-4 text-sm font-semibold hover:shadow-md">👤 Profil public</Link>
      </nav>

      <section id="permis" className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="heading text-xl">Permis de conduire</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${license.cls}`}>{license.label}</span>
        </div>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          Obligatoire pour louer. Les permis de l&apos;Union européenne et les permis étrangers accompagnés d&apos;un permis international sont acceptés.
        </p>
        <LicenseForm number={user.licenseNumber} issuedAt={user.licenseIssuedAt?.toISOString().slice(0, 10) ?? null} />
      </section>

      <section className="card p-6">
        <h2 className="heading mb-4 text-xl">Informations personnelles</h2>
        <ProfileForm user={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone, territory: user.territory, bio: user.bio, iban: user.iban }} />
      </section>

      <form action={logout} className="md:hidden">
        <button className="btn-danger w-full">Se déconnecter</button>
      </form>
    </div>
  );
}

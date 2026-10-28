import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { euros, vehicleName } from "@/lib/format";
import { getTerritory } from "@/lib/territories";
import { WEATHER_LEVELS, type WeatherLevel } from "@/lib/constants";
import { endWeatherAlert, reviewLicense, setVehicleSuspended } from "@/app/actions/admin";
import { WeatherAlertForm } from "@/components/forms/WeatherAlertForm";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireAdmin();
  const [users, vehicles, bookingStats, gmv, pendingLicenses, alerts, recentBookings, listings] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count({ where: { status: "ACTIVE" } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, _sum: { total: true, ownerPayout: true } }),
    prisma.user.findMany({ where: { licenseStatus: "PENDING" }, orderBy: { createdAt: "asc" } }),
    prisma.weatherAlert.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.booking.findMany({ include: { vehicle: true, renter: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.vehicle.findMany({ include: { owner: true }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const revenue = (gmv._sum.total ?? 0) - (gmv._sum.ownerPayout ?? 0);

  return (
    <div className="container-app space-y-8 py-8">
      <h1 className="heading text-3xl">Administration</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Membres" value={String(users)} />
        <Kpi label="Annonces en ligne" value={String(vehicles)} />
        <Kpi label="Volume d'affaires" value={euros(gmv._sum.total ?? 0)} />
        <Kpi label="Revenu Woulé" value={euros(revenue)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {bookingStats.map((s) => (
          <span key={s.status} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm ring-1 ring-slate-200">
            <StatusBadge status={s.status} /> {s._count._all}
          </span>
        ))}
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="heading text-xl">🌀 Vigilance météo / Garantie Cyclone</h2>
        <WeatherAlertForm />
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
            <span><strong>{getTerritory(a.territory).name}</strong> · {WEATHER_LEVELS[a.level as WeatherLevel]?.label} · {a.title}</span>
            <form action={endWeatherAlert.bind(null, a.id)}><SubmitButton className="btn-ghost text-xs">Lever l&apos;alerte</SubmitButton></form>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="heading text-xl">Permis à vérifier ({pendingLicenses.length})</h2>
        {pendingLicenses.length === 0 ? <p className="mt-2 text-sm text-slate-500">Rien à vérifier. 🎉</p> : (
          <ul className="mt-4 divide-y divide-slate-100">
            {pendingLicenses.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold">{u.firstName} {u.lastName} · {u.email}</p>
                  <p className="text-slate-500">N° {u.licenseNumber} · obtenu le {u.licenseIssuedAt ? formatDate(u.licenseIssuedAt) : "?"}</p>
                </div>
                <div className="flex gap-2">
                  {u.licenseFileUrl && <a href={u.licenseFileUrl} target="_blank" rel="noreferrer" className="btn-ghost">Voir le document</a>}
                  <form action={reviewLicense.bind(null, u.id, true)}><SubmitButton className="btn-primary">Valider</SubmitButton></form>
                  <form action={reviewLicense.bind(null, u.id, false)}><SubmitButton className="btn-danger">Refuser</SubmitButton></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card overflow-x-auto p-5">
        <h2 className="heading text-xl">Dernières réservations</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Véhicule</th><th>Locataire</th><th>Statut</th><th className="text-right">Montant</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {recentBookings.map((b) => (
              <tr key={b.id}>
                <td className="py-2"><Link href={`/reservations/${b.id}`} className="hover:underline">{vehicleName(b.vehicle)}</Link></td>
                <td>{b.renter.firstName} {b.renter.lastName}</td>
                <td><StatusBadge status={b.status} /></td>
                <td className="text-right">{euros(b.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto p-5">
        <h2 className="heading text-xl">Modération des annonces</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Annonce</th><th>Propriétaire</th><th>Territoire</th><th>Statut</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((v) => (
              <tr key={v.id}>
                <td className="py-2"><Link href={`/vehicules/${v.id}`} className="hover:underline">{vehicleName(v)}</Link></td>
                <td>{v.owner.firstName} {v.owner.lastName}</td>
                <td>{getTerritory(v.territory).name}</td>
                <td>{v.status}</td>
                <td className="text-right">
                  <form action={setVehicleSuspended.bind(null, v.id, v.status !== "SUSPENDED")}>
                    <SubmitButton className="btn-ghost text-xs">{v.status === "SUSPENDED" ? "Réactiver" : "Suspendre"}</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

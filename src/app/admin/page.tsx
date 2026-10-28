import type { Metadata } from "next";
import Link from "next/link";
import { BanUser, HideListing, ResolveReport } from "@/components/admin-controls";
import { Badge, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { emailEnabled, stripeEnabled } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { communeName } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import { adminStats, listReports, recentUsers } from "@/lib/services/moderation";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default async function AdminPage() {
  await requireAdmin();
  const [stats, reports, users] = await Promise.all([adminStats(), listReports(), recentUsers()]);
  const tiles = [
    { label: "Membres", value: stats.users, sub: `+${stats.usersWeek} cette semaine` },
    { label: "Annonces en ligne", value: stats.listings },
    { label: "Réservations", value: stats.bookings, sub: `${stats.completed} terminées` },
    { label: "Volume confirmé", value: formatEuros(stats.volume) },
    { label: "Signalements ouverts", value: stats.openReports },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="Administration" subtitle={`E-mails : ${emailEnabled() ? "activés" : "désactivés (logs)"} · Paiement en ligne : ${stripeEnabled() ? "activé" : "désactivé"}`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="text-2xl font-bold">{t.value}</p>
            {t.sub && <p className="text-xs text-muted">{t.sub}</p>}
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Signalements</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted">Aucun signalement.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map(({ report, reporterName, listingTitle, listingStatus, targetName, targetBanned }) => (
              <li key={report.id} className="card space-y-2 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={report.status === "open" ? "red" : "neutral"}>{report.status === "open" ? "Ouvert" : "Traité"}</Badge>
                  <strong>{report.reason}</strong>
                  <span className="text-muted">par {reporterName} · {formatDateTime(report.createdAt)}</span>
                </div>
                {report.details && <p className="text-muted">« {report.details} »</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {report.listingId && (
                    <>
                      <Link href={`/annonces/${report.listingId}`} className="font-medium text-brand-600 hover:underline">Annonce : {listingTitle}</Link>
                      {listingStatus && listingStatus !== "deleted" && <HideListing id={report.listingId} hidden={listingStatus === "hidden"} />}
                    </>
                  )}
                  {report.userId && (
                    <>
                      <Link href={`/profil/${report.userId}`} className="font-medium text-brand-600 hover:underline">Membre : {targetName}</Link>
                      <BanUser id={report.userId} banned={targetBanned} />
                    </>
                  )}
                  {report.status === "open" && <ResolveReport id={report.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Derniers inscrits</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-muted uppercase">
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Commune</th>
                <th className="p-3">Inscription</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3">
                    <Link href={`/profil/${u.id}`} className="font-medium hover:underline">{u.name}</Link>
                    {u.role === "admin" && <Badge tone="green">admin</Badge>}
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{communeName(u.commune)}</td>
                  <td className="p-3 whitespace-nowrap">{formatDateTime(u.createdAt)}</td>
                  <td className="p-3">{u.role !== "admin" && <BanUser id={u.id} banned={Boolean(u.bannedAt)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

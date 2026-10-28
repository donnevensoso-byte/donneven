import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { DeleteAccountForm, PasswordForm, ResendVerificationButton } from "@/components/account-forms";
import { Alert, Avatar, Badge, EmptyState, imageUrl, PageHeader } from "@/components/ui";
import { isVerified, requireUser } from "@/lib/auth";
import { stripeEnabled } from "@/lib/config";
import { communeName } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import { ownerEarnings, pendingRequestCount } from "@/lib/services/bookings";
import { listingsByOwner } from "@/lib/services/listings";
import { ratingSummary } from "@/lib/services/reviews";

export const metadata: Metadata = { title: "Mon compte" };

const STATUS: Record<string, { label: string; tone: "green" | "yellow" | "red" }> = {
  active: { label: "En ligne", tone: "green" },
  paused: { label: "En pause", tone: "yellow" },
  hidden: { label: "Masquée", tone: "red" },
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ motdepasse?: string; supprimee?: string }> }) {
  const flags = await searchParams;
  const user = await requireUser("/compte");
  const [myListings, earnings, pending, rating] = await Promise.all([
    listingsByOwner(user.id, true),
    ownerEarnings(user.id),
    pendingRequestCount(user.id),
    ratingSummary(user.id),
  ]);

  const links = [
    { href: "/reservations", icon: "📅", label: "Mes locations" },
    { href: "/reservations?vue=recues", icon: "📬", label: `Demandes reçues${pending ? ` (${pending})` : ""}` },
    { href: "/messages", icon: "💬", label: "Messages" },
    { href: "/compte/favoris", icon: "❤️", label: "Favoris" },
    { href: "/compte/notifications", icon: "🔔", label: "Notifications" },
    { href: "/compte/profil", icon: "👤", label: "Modifier mon profil" },
    ...(stripeEnabled() ? [{ href: "/compte/paiements", icon: "💳", label: "Paiements en ligne" }] : []),
    ...(user.role === "admin" ? [{ href: "/admin", icon: "🛠️", label: "Administration" }] : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {flags.motdepasse && <div className="mb-4"><Alert tone="success">Nouveau mot de passe enregistré.</Alert></div>}
      {flags.supprimee && <div className="mb-4"><Alert tone="success">Annonce supprimée.</Alert></div>}
      {!isVerified(user) && (
        <div className="mb-4">
          <Alert tone="warning">
            Confirmez votre adresse e-mail ({user.email}) pour publier et réserver. <ResendVerificationButton />
          </Alert>
        </div>
      )}

      <div className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <Avatar name={user.name} imageId={user.avatarImageId} size={64} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Bonjour {user.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted">
            {communeName(user.commune)} · {rating.count > 0 ? `${rating.average?.toFixed(1).replace(".", ",")} ★ (${rating.count} avis)` : "pas encore d'avis"} ·{" "}
            <Link href={`/profil/${user.id}`} className="text-brand-600 hover:underline">voir mon profil public</Link>
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">{formatEuros(earnings.total)}</p>
            <p className="text-xs text-muted">gagnés</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{earnings.count}</p>
            <p className="text-xs text-muted">locations</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Mon compte">
          <ul className="card divide-y divide-line overflow-hidden text-sm font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center gap-3 px-4 py-3 hover:bg-sand">
                  <span aria-hidden>{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-left text-flame-500 hover:bg-sand">
                  <span aria-hidden>🚪</span> Se déconnecter
                </button>
              </form>
            </li>
          </ul>
        </nav>

        <div className="space-y-6">
          <section>
            <PageHeader
              title="Mes annonces"
              actions={<Link href="/annonces/nouvelle" className="btn-sun">+ Proposer un outil</Link>}
            />
            {myListings.length === 0 ? (
              <EmptyState icon="🧰" title="Vous n'avez pas encore d'annonce" action={{ href: "/annonces/nouvelle", label: "Publier ma première annonce" }}>
                Débroussailleuse, perceuse, barnum… Ce qui dort dans votre carbet peut rendre service et vous rapporter.
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {myListings.map((l) => (
                  <li key={l.id} className="card flex items-center gap-4 p-3">
                    <Link href={`/annonces/${l.id}`} className="size-16 shrink-0 overflow-hidden rounded-xl bg-line">
                      {l.coverImageId && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(l.coverImageId, "thumb")} alt="" className="size-full object-cover" />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/annonces/${l.id}`} className="block truncate font-semibold hover:underline">{l.title}</Link>
                      <p className="text-sm text-muted">{formatEuros(l.dayPrice)} / jour · {communeName(l.commune)}</p>
                      <Badge tone={STATUS[l.status]?.tone ?? "yellow"}>{STATUS[l.status]?.label ?? l.status}</Badge>
                    </div>
                    <Link href={`/annonces/${l.id}/modifier`} className="btn-secondary shrink-0">Modifier</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">Sécurité</h2>
            <p className="text-sm text-muted">Connecté en tant que {user.email}</p>
            <PasswordForm />
          </section>

          <details className="card p-5">
            <summary className="cursor-pointer font-semibold text-flame-500">Supprimer mon compte</summary>
            <div className="mt-3">
              <DeleteAccountForm />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

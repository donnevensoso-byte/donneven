import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingGrid } from "@/components/listing-card";
import { ReportButton } from "@/components/listing-actions";
import { Avatar, Badge, Stars } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatMonthYear } from "@/lib/dates";
import { communeName } from "@/lib/guyane";
import { listingsByOwner } from "@/lib/services/listings";
import { reviewsForUser } from "@/lib/services/reviews";
import { getPublicProfile } from "@/lib/services/users";
import { publicName } from "@/lib/text";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return { title: profile ? `${publicName(profile.name)} – profil` : "Profil introuvable" };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(id), getCurrentUser()]);
  if (!profile) notFound();
  const [listings, reviews] = await Promise.all([listingsByOwner(id), reviewsForUser(id)]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={profile.name} imageId={profile.avatarImageId} size={96} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{publicName(profile.name)}</h1>
          <p className="text-muted">📍 {communeName(profile.commune)} · membre depuis {formatMonthYear(profile.createdAt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Stars value={profile.rating.average} count={profile.rating.count} size="md" />
            {profile.emailVerifiedAt && <Badge tone="green">✓ E-mail vérifié</Badge>}
            {profile.stats.hasPhone && <Badge tone="green">✓ Téléphone renseigné</Badge>}
          </div>
          {profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm">{profile.bio}</p>}
        </div>
        <dl className="grid grid-cols-3 gap-4 text-center sm:grid-cols-1 sm:text-right">
          <div>
            <dt className="text-xs text-muted">Locations</dt>
            <dd className="text-lg font-bold">{profile.stats.rentalsAsOwner + profile.stats.rentalsAsRenter}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Annonces</dt>
            <dd className="text-lg font-bold">{profile.stats.listingCount}</dd>
          </div>
          {profile.stats.responseRate != null && (
            <div>
              <dt className="text-xs text-muted">Taux de réponse</dt>
              <dd className="text-lg font-bold">{profile.stats.responseRate} %</dd>
            </div>
          )}
        </dl>
      </div>

      {listings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Son matériel à louer</h2>
          <ListingGrid listings={listings} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Avis reçus {reviews.length > 0 && `(${reviews.length})`}</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">Pas encore d&apos;avis.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.authorName} imageId={r.authorAvatarId} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {publicName(r.authorName)} <span className="font-normal text-muted">· {r.role === "renter" ? "locataire" : "propriétaire"}</span>
                    </p>
                    <p className="truncate text-xs text-muted">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.listingTitle} · {formatMonthYear(r.createdAt)}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewer && viewer.id !== id && (
        <div className="mt-8">
          <ReportButton userId={id} />
        </div>
      )}
    </div>
  );
}

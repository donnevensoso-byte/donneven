import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/booking-widget";
import { ListingGrid } from "@/components/listing-card";
import { ContactButton, FavoriteButton, OwnerListingControls, ReportButton } from "@/components/listing-actions";
import { AreaMap } from "@/components/map";
import { Alert, Avatar, Badge, imageUrl, Stars } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { MAX_RENTAL_DAYS, serviceFeePercent, stripeEnabled } from "@/lib/config";
import { formatMonthYear, todayInGuyane } from "@/lib/dates";
import { communeName, conditionLabel, getCategory } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import { isFavorite } from "@/lib/services/favorites";
import { getListingDetail, incrementViews, listingsByOwner } from "@/lib/services/listings";
import { ratingSummary, reviewsForListing } from "@/lib/services/reviews";
import { publicName, truncate } from "@/lib/text";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ publiee?: string; modifiee?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getListingDetail(id);
  if (!detail) return { title: "Annonce introuvable" };
  const { listing, photos } = detail;
  const description = `${formatEuros(listing.dayPrice)}/jour à ${communeName(listing.commune)}. ${truncate(listing.description, 140)}`;
  return {
    title: `${listing.title} à louer – ${communeName(listing.commune)}`,
    description,
    openGraph: { title: listing.title, description, images: photos[0] ? [imageUrl(photos[0].id)] : [] },
  };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const flags = await searchParams;
  const user = await getCurrentUser();
  const detail = await getListingDetail(id, user?.id);
  if (!detail) notFound();
  const { listing, owner, photos, unavailable, isOwner } = detail;
  const category = getCategory(listing.category);

  const [reviews, ownerRating, favorite, otherListings] = await Promise.all([
    reviewsForListing(listing.id),
    ratingSummary(owner.id),
    user ? isFavorite(user.id, listing.id) : false,
    listingsByOwner(owner.id),
    isOwner ? Promise.resolve() : incrementViews(listing.id),
  ]);
  const listingRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const online = stripeEnabled() && owner.stripeOnboarded;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {flags.publiee && (
        <div className="mb-4">
          <Alert tone="success">🎉 Votre annonce est en ligne ! Partagez-la à vos voisins et sur vos groupes WhatsApp.</Alert>
        </div>
      )}
      {flags.modifiee && (
        <div className="mb-4">
          <Alert tone="success">Annonce mise à jour.</Alert>
        </div>
      )}
      {isOwner && listing.status !== "active" && (
        <div className="mb-4">
          <Alert tone="warning">
            {listing.status === "hidden"
              ? "Cette annonce a été masquée par la modération et n'est pas visible."
              : "Cette annonce est en pause : elle n'apparaît pas dans les recherches."}
          </Alert>
        </div>
      )}

      <nav className="mb-3 text-sm text-muted" aria-label="Fil d'Ariane">
        <Link href="/recherche" className="hover:underline">Annonces</Link> ›{" "}
        <Link href={`/recherche?categorie=${listing.category}`} className="hover:underline">{category?.name}</Link> ›{" "}
        <Link href={`/recherche?commune=${listing.commune}`} className="hover:underline">{communeName(listing.commune)}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0" data-testid="gallery">
            {photos.map((p, i) => (
              <a
                key={p.id}
                href={imageUrl(p.id)}
                target="_blank"
                rel="noreferrer"
                className={`relative shrink-0 snap-center overflow-hidden rounded-card bg-line ${
                  i === 0 ? "aspect-[4/3] w-[88%] sm:col-span-4 sm:w-auto" : "aspect-[4/3] w-[88%] sm:aspect-square sm:w-auto"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(p.id, i === 0 ? "full" : "thumb")} alt={`${listing.title} – photo ${i + 1}`} className="size-full object-cover" />
              </a>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">{category?.icon} {category?.name}</Badge>
                {listing.delivery && <Badge tone="yellow">🚚 Livraison possible</Badge>}
              </div>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{listing.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-muted">
                <span>📍 {communeName(listing.commune)}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</span>
                <Stars value={listingRating} count={reviews.length} size="md" />
              </p>
            </div>
            {!isOwner && <FavoriteButton listingId={listing.id} initial={favorite} />}
          </div>

          {isOwner && (
            <div className="card mt-5 p-4">
              <p className="mb-3 text-sm text-muted">
                C&apos;est votre annonce · vue {listing.viewCount} fois ·{" "}
                <Link href={`/annonces/${listing.id}/modifier#disponibilites`} className="font-medium text-brand-600 hover:underline">
                  gérer les disponibilités
                </Link>
              </p>
              <OwnerListingControls listingId={listing.id} status={listing.status} />
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-ink/90">{listing.description}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Détails</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="card p-3">
                <dt className="text-muted">État</dt>
                <dd className="font-semibold">{conditionLabel(listing.condition)}</dd>
              </div>
              {listing.brand && (
                <div className="card p-3">
                  <dt className="text-muted">Marque</dt>
                  <dd className="font-semibold">{listing.brand}</dd>
                </div>
              )}
              <div className="card p-3">
                <dt className="text-muted">Caution</dt>
                <dd className="font-semibold">{listing.deposit > 0 ? formatEuros(listing.deposit) : "Aucune"}</dd>
              </div>
              <div className="card p-3">
                <dt className="text-muted">Durée minimale</dt>
                <dd className="font-semibold">{listing.minDays} jour{listing.minDays > 1 ? "s" : ""}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Où récupérer le matériel</h2>
            <p className="mt-1 text-sm text-muted">Zone approximative. L&apos;adresse précise est convenue par message après la réservation.</p>
            <div className="mt-3 h-64 overflow-hidden rounded-card border border-line">
              <AreaMap lat={listing.lat} lng={listing.lng} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Avis des locataires {reviews.length > 0 && `(${reviews.length})`}</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Pas encore d&apos;avis sur ce matériel.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.authorName} imageId={r.authorAvatarId} size={36} />
                      <div>
                        <p className="text-sm font-semibold">{publicName(r.authorName)}</p>
                        <p className="text-xs text-muted">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {formatMonthYear(r.createdAt)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {!isOwner && (
            <div className="card p-5" id="reserver">
              <BookingWidget
                listingId={listing.id}
                dayPrice={listing.dayPrice}
                weekPrice={listing.weekPrice}
                deposit={listing.deposit}
                minDays={listing.minDays}
                unavailable={unavailable}
                today={todayInGuyane()}
                maxDays={MAX_RENTAL_DAYS}
                online={online}
                feePercent={serviceFeePercent()}
                loggedIn={Boolean(user)}
              />
            </div>
          )}
          <div className="card p-5">
            <Link href={`/profil/${owner.id}`} className="flex items-center gap-3 hover:opacity-90">
              <Avatar name={owner.name} imageId={owner.avatarImageId} size={52} />
              <div>
                <p className="font-semibold">{publicName(owner.name)}</p>
                <p className="text-sm text-muted">{communeName(owner.commune)} · membre depuis {formatMonthYear(owner.createdAt)}</p>
                <Stars value={ownerRating.average} count={ownerRating.count} />
              </div>
            </Link>
            {!isOwner && (
              <div className="mt-4">
                {user ? (
                  <ContactButton listingId={listing.id} />
                ) : (
                  <Link href={`/connexion?next=/annonces/${listing.id}`} className="btn-secondary w-full">💬 Poser une question</Link>
                )}
              </div>
            )}
          </div>
          <div className="rounded-card border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
            <p className="font-semibold">🛡️ Louez sereinement</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Échangez uniquement via la messagerie Zouti avant la réservation.</li>
              <li>Vérifiez le matériel ensemble et imprimez le contrat de location.</li>
              <li>Ne versez jamais d&apos;argent avant d&apos;avoir vu le matériel.</li>
            </ul>
            <Link href="/confiance" className="mt-2 inline-block font-semibold underline">Nos conseils</Link>
          </div>
          {!isOwner && <ReportButton listingId={listing.id} />}
        </aside>
      </div>

      {otherListings.filter((l) => l.id !== listing.id).length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Autres annonces de {publicName(owner.name)}</h2>
          <ListingGrid listings={otherListings.filter((l) => l.id !== listing.id).slice(0, 4)} />
        </section>
      )}
    </div>
  );
}

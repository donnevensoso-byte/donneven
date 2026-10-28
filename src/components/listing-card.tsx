import Link from "next/link";
import { communeName, getCategory } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import type { ListingCard as Card } from "@/lib/services/listings";
import { imageUrl, Stars } from "./ui";

export function ListingCard({ listing, priority = false }: { listing: Card; priority?: boolean }) {
  const category = getCategory(listing.category);
  return (
    <Link href={`/annonces/${listing.id}`} className="group block" data-testid="listing-card">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-line">
        {listing.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(listing.coverImageId, "thumb")}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-4xl">{category?.icon ?? "🧰"}</span>
        )}
        {listing.delivery && (
          <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold">🚚 Livraison possible</span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold group-hover:underline">{listing.title}</h3>
          <Stars value={listing.rating} count={listing.reviewCount} />
        </div>
        <p className="line-clamp-1 text-sm text-muted">
          {communeName(listing.commune)}
          {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
          {listing.distanceKm != null && listing.distanceKm >= 1 ? ` · ${Math.round(listing.distanceKm)} km` : ""}
        </p>
        <p className="mt-0.5 text-sm">
          <span className="font-bold">{formatEuros(listing.dayPrice)}</span>
          <span className="text-muted"> / jour</span>
          {listing.weekPrice ? <span className="text-muted"> · {formatEuros(listing.weekPrice)} / sem.</span> : null}
        </p>
      </div>
    </Link>
  );
}

export function ListingGrid({ listings }: { listings: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} priority={i < 4} />
      ))}
    </div>
  );
}

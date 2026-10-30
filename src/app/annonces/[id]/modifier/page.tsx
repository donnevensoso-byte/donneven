import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateListingAction } from "@/app/actions/listings";
import { AvailabilityManager } from "@/components/availability-manager";
import { CommuneOptions } from "@/components/commune-select";
import { ListingForm } from "@/components/listing-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { MAX_PHOTOS } from "@/lib/config";
import { todayInGuyane } from "@/lib/dates";
import { getListingDetail } from "@/lib/services/listings";

export const metadata: Metadata = { title: "Modifier l'annonce" };

const toEuros = (cents: number | null) => (cents == null ? "" : String(cents / 100).replace(".", ","));

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/annonces/${id}/modifier`);
  const detail = await getListingDetail(id, user.id);
  if (!detail || !detail.isOwner) notFound();
  const { listing, photos, unavailable } = detail;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Modifier l'annonce"
        subtitle={<Link href={`/annonces/${id}`} className="text-brand-600 hover:underline">← Voir l&apos;annonce</Link>}
      />
      <section id="disponibilites" className="card mb-5 scroll-mt-24 space-y-3 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Disponibilités</h2>
          <p className="text-sm text-muted">Bloquez les dates où vous utilisez le matériel ou êtes absent.</p>
        </div>
        <AvailabilityManager listingId={id} periods={unavailable} today={todayInGuyane()} />
      </section>
      <ListingForm
        action={updateListingAction.bind(null, id)}
        maxPhotos={MAX_PHOTOS}
        existingPhotos={photos}
        communeOptions={<CommuneOptions />}
        submitLabel="Enregistrer les modifications"
        defaults={{
          title: listing.title,
          description: listing.description,
          category: listing.category,
          brand: listing.brand,
          condition: listing.condition,
          dayPrice: toEuros(listing.dayPrice),
          weekPrice: toEuros(listing.weekPrice),
          deposit: toEuros(listing.deposit),
          minDays: listing.minDays,
          minNoticeDays: listing.minNoticeDays,
          commune: listing.commune,
          neighborhood: listing.neighborhood,
          lat: listing.lat,
          lng: listing.lng,
          delivery: listing.delivery,
          pickupNotes: listing.pickupNotes,
        }}
      />
    </div>
  );
}

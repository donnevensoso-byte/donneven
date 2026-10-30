import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth";
import { imageUrl } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/dates";
import { communeName, conditionLabel } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import { listBookingPhotos, type BookingPhoto } from "@/lib/services/booking-photos";
import { getBookingForUser } from "@/lib/services/bookings";

export const metadata: Metadata = { title: "Contrat de location", robots: { index: false } };

function PhotoStrip({ photos }: { photos: BookingPhoto[] }) {
  if (photos.length === 0) return null;
  // Une remarque est jointe à chaque photo d'un même envoi : on ne l'écrit qu'une fois.
  const notes = [...new Map(photos.filter((p) => p.note).map((p) => [`${p.authorId}|${p.note}`, p])).values()];
  return (
    <>
      <ul className="mt-2 grid grid-cols-4 gap-1">
        {photos.map((p) => (
          <li key={p.imageId}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(p.imageId, "thumb")} alt="" className="aspect-square w-full rounded object-cover" />
            <p className="text-[9px] leading-tight text-muted">{formatDateTime(p.createdAt)}</p>
          </li>
        ))}
      </ul>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-ink">
          {notes.map((p) => (
            <li key={p.imageId}>
              « {p.note} » <span className="text-muted">– {p.authorName ?? "un membre"}, {formatDateTime(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Party({ title, person }: { title: string; person: { name: string; phone: string | null; email: string; commune?: string } }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-xs font-semibold text-muted uppercase">{title}</p>
      <p className="mt-1 font-semibold">{person.name}</p>
      <p>Tél. : {person.phone ?? "………………………"}</p>
      <p>E-mail : {person.email}</p>
      <p>Adresse : ……………………………………………</p>
      <p>Pièce d&apos;identité n° : …………………………</p>
    </div>
  );
}

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/reservations/${id}/contrat`);
  const data = await getBookingForUser(user.id, id);
  if (!data || !["accepted", "ongoing", "completed"].includes(data.booking.status)) notFound();
  const { booking, listing, role, other, self } = data;
  const owner = role === "owner" ? { ...self, commune: undefined } : other;
  const renter = role === "renter" ? { ...self, commune: undefined } : other;
  const total = booking.rentalAmount + booking.serviceFee;
  const photos = await listBookingPhotos(booking.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/reservations/${id}`} className="text-sm text-brand-600 hover:underline">← Retour à la réservation</Link>
        <PrintButton />
      </div>
      <article className="space-y-5 bg-white p-6 text-sm leading-relaxed shadow-card print:shadow-none sm:p-10">
        <header className="text-center">
          <h1 className="text-xl font-bold">Contrat de location de matériel entre particuliers</h1>
          <p className="text-muted">Réservation Zouti n° {booking.id}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          <Party title="Le propriétaire (loueur)" person={owner} />
          <Party title="Le locataire" person={renter} />
        </section>

        <section>
          <h2 className="font-semibold">1. Matériel loué</h2>
          <p>
            <strong>{listing.title}</strong>
            {listing.brand ? ` – ${listing.brand}` : ""} · état déclaré : {conditionLabel(listing.condition)}.
            Retrait à {communeName(listing.commune)}{listing.neighborhood ? ` (${listing.neighborhood})` : ""}.
          </p>
          <p>Accessoires remis : ………………………………………………………………………………………</p>
        </section>

        <section>
          <h2 className="font-semibold">2. Durée</h2>
          <p>
            Du <strong>{formatDate(booking.startDate, { weekday: "long", year: "numeric" })}</strong> au{" "}
            <strong>{formatDate(booking.endDate, { weekday: "long", year: "numeric" })}</strong> inclus, soit {booking.days} jour{booking.days > 1 ? "s" : ""}.
            Heure de remise : ……… h ……… · Heure de retour : ……… h ………
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Prix et caution</h2>
          <p>
            Prix de la location : <strong>{formatEuros(booking.rentalAmount)}</strong>
            {booking.serviceFee > 0 ? ` (+ ${formatEuros(booking.serviceFee)} de frais de service, total ${formatEuros(total)} payé en ligne)` : ", réglé au propriétaire lors de la remise"}.
          </p>
          <p>
            Caution : <strong>{booking.deposit > 0 ? formatEuros(booking.deposit) : "aucune"}</strong>
            {booking.deposit > 0 && " remise au propriétaire lors de la remise (chèque non encaissé ou espèces) et restituée au retour du matériel en bon état, déduction faite des éventuels dommages constatés contradictoirement."}
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Engagements</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Le propriétaire certifie être propriétaire du matériel, qu&apos;il est en bon état de fonctionnement et conforme à la réglementation, et fournit les consignes d&apos;utilisation et de sécurité.</li>
            <li>Le locataire utilise le matériel en « bon père de famille », conformément à sa destination et aux consignes reçues, avec les équipements de protection adaptés. Il ne le prête ni ne le sous-loue.</li>
            <li>Le locataire est responsable du matériel pendant toute la durée de la location (vol, perte, casse hors usure normale). Il vérifie auprès de son assureur (responsabilité civile / multirisque habitation) la couverture des biens loués.</li>
            <li>Le matériel est rendu propre, à la date et à l&apos;heure convenues, avec le plein de carburant le cas échéant. Tout retard non convenu peut être facturé au tarif journalier.</li>
            <li>En cas de panne, le locataire prévient immédiatement le propriétaire et n&apos;entreprend aucune réparation sans son accord.</li>
            <li>Zouti met en relation les membres et n&apos;est pas partie au présent contrat.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">5. État des lieux</h2>
          <table className="mt-2 w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="w-1/2 border border-line p-2">Au départ</th>
                <th className="w-1/2 border border-line p-2">Au retour</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="h-28 border border-line p-2 align-top text-muted">
                  État, défauts constatés, niveau de carburant / batterie :
                  <PhotoStrip photos={photos.filter((p) => p.stage === "handover")} />
                </td>
                <td className="h-28 border border-line p-2 align-top text-muted">
                  État, dommages éventuels, montant retenu sur la caution :
                  <PhotoStrip photos={photos.filter((p) => p.stage === "return")} />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="grid gap-6 pt-4 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <p>Fait à ……………………, le ……………………</p>
            <p className="mt-2 font-semibold">Signature du propriétaire</p>
            <div className="mt-2 h-20 border-b border-line" />
          </div>
          <div>
            <p>&nbsp;</p>
            <p className="mt-2 font-semibold">Signature du locataire</p>
            <div className="mt-2 h-20 border-b border-line" />
          </div>
        </section>
      </article>
    </div>
  );
}

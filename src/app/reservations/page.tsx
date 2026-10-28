import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, imageUrl, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDateRange } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { bookingStatusLabel, listUserBookings } from "@/lib/services/bookings";
import { publicName } from "@/lib/text";

export const metadata: Metadata = { title: "Mes réservations" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const user = await requireUser("/reservations");
  const as = vue === "recues" ? "owner" : "renter";
  const [rows, received] = await Promise.all([listUserBookings(user.id, as), as === "renter" ? listUserBookings(user.id, "owner") : null]);
  const pendingReceived = (as === "owner" ? rows : received ?? []).filter((r) => r.booking.status === "pending").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="Réservations" />
      <div className="mb-6 inline-flex rounded-xl border border-line bg-white p-1 text-sm font-medium" role="tablist">
        <Link href="/reservations" role="tab" aria-selected={as === "renter"} className={`rounded-lg px-4 py-2 ${as === "renter" ? "bg-brand-600 text-white" : "text-muted"}`}>
          Mes locations
        </Link>
        <Link href="/reservations?vue=recues" role="tab" aria-selected={as === "owner"} className={`rounded-lg px-4 py-2 ${as === "owner" ? "bg-brand-600 text-white" : "text-muted"}`}>
          Demandes reçues
          {pendingReceived > 0 && <span className="ml-1.5 rounded-full bg-flame-500 px-1.5 text-[11px] text-white">{pendingReceived}</span>}
        </Link>
      </div>

      {rows.length === 0 ? (
        as === "renter" ? (
          <EmptyState icon="📅" title="Aucune location pour l'instant" action={{ href: "/recherche", label: "Trouver du matériel" }}>
            Vos demandes de réservation apparaîtront ici.
          </EmptyState>
        ) : (
          <EmptyState icon="📬" title="Aucune demande reçue" action={{ href: "/annonces/nouvelle", label: "Proposer un outil" }}>
            Les demandes des locataires pour votre matériel apparaîtront ici.
          </EmptyState>
        )
      ) : (
        <ul className="space-y-3">
          {rows.map(({ booking, listingTitle, listingImageId, otherName }) => {
            const tone =
              booking.status === "pending" || (booking.status === "accepted" && booking.paymentMethod === "online" && booking.paymentStatus !== "paid")
                ? "yellow"
                : ["declined", "cancelled", "expired"].includes(booking.status)
                  ? "neutral"
                  : "green";
            return (
              <li key={booking.id}>
                <Link href={`/reservations/${booking.id}`} className="card flex items-center gap-4 p-3 hover:border-brand-200" data-testid="booking-row">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-line">
                    {listingImageId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl(listingImageId, "thumb")} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{listingTitle}</p>
                    <p className="text-sm text-muted">
                      {formatDateRange(booking.startDate, booking.endDate)} · {as === "owner" ? "par" : "chez"} {publicName(otherName)}
                    </p>
                    <div className="mt-1">
                      <Badge tone={tone}>{bookingStatusLabel(booking)}</Badge>
                    </div>
                  </div>
                  <p className="shrink-0 text-right font-semibold">{formatEuros(booking.rentalAmount + booking.serviceFee)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

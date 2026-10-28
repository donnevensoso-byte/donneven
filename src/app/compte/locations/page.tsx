import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expireStaleRequests } from "@/lib/bookings";
import { BookingRow } from "@/components/BookingRow";

export const metadata: Metadata = { title: "Mes locations" };

export default async function TripsPage() {
  const user = await requireUser("/compte/locations");
  await expireStaleRequests();
  const bookings = await prisma.booking.findMany({
    where: { renterId: user.id },
    include: { vehicle: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } } },
    orderBy: { startAt: "desc" },
  });
  const active = bookings.filter((b) => ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(b.status));
  const past = bookings.filter((b) => !active.includes(b));

  return (
    <div className="container-app max-w-3xl py-8">
      <h1 className="heading text-3xl">Mes locations</h1>
      {bookings.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-4xl">🚗</p>
          <p className="mt-3 font-semibold">Pas encore de location</p>
          <p className="mt-1 text-slate-500">Trouvez le véhicule idéal pour votre prochain séjour.</p>
          <Link href="/recherche" className="btn-primary mt-5">Rechercher un véhicule</Link>
        </div>
      ) : (
        <>
          <h2 className="mb-3 mt-8 font-semibold text-slate-500">À venir et en cours</h2>
          <div className="space-y-3">
            {active.length === 0 ? <p className="text-sm text-slate-500">Aucune location à venir.</p> : active.map((b) => <BookingRow key={b.id} b={b} />)}
          </div>
          {past.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 font-semibold text-slate-500">Historique</h2>
              <div className="space-y-3">{past.map((b) => <BookingRow key={b.id} b={b} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}

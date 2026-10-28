import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expireStaleRequests } from "@/lib/bookings";
import { userRating } from "@/lib/queries";
import { euros, vehicleName } from "@/lib/format";
import { BookingRow } from "@/components/BookingRow";
import { VehicleImage } from "@/components/VehicleImage";
import { Stars } from "@/components/Stars";

export const metadata: Metadata = { title: "Espace propriétaire" };

const VEHICLE_STATUS: Record<string, string> = { ACTIVE: "En ligne", PAUSED: "En pause", DRAFT: "Brouillon", SUSPENDED: "Suspendue" };

export default async function OwnerDashboard() {
  const user = await requireUser("/proprietaire");
  await expireStaleRequests();
  const [vehicles, bookings, rating] = await Promise.all([
    prisma.vehicle.findMany({
      where: { ownerId: user.id },
      include: { photos: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { bookings: { where: { status: "COMPLETED" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { vehicle: { ownerId: user.id } },
      include: { vehicle: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } }, renter: { select: { firstName: true } } },
      orderBy: { startAt: "asc" },
    }),
    userRating(user.id),
  ]);

  if (vehicles.length === 0) {
    return (
      <div className="container-app max-w-2xl py-12 text-center">
        <p className="text-5xl">🔑</p>
        <h1 className="heading mt-4 text-3xl">Mettez votre véhicule en location</h1>
        <p className="mt-2 text-slate-600">Créez votre annonce en 5 minutes. Vous choisissez vos prix et vos dates, Woulé s&apos;occupe de l&apos;assurance et des paiements.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/proprietaire/vehicules/nouveau" className="btn-accent">Créer mon annonce</Link>
          <Link href="/louer-ma-voiture" className="btn-outline">Estimer mes revenus</Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paid = bookings.filter((b) => ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(b.status));
  const earnedThisMonth = paid.filter((b) => b.status === "COMPLETED" && b.endAt >= monthStart).reduce((s, b) => s + b.ownerPayout, 0);
  const upcomingEarnings = paid.filter((b) => b.status !== "COMPLETED").reduce((s, b) => s + b.ownerPayout, 0);
  const totalEarned = paid.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.ownerPayout, 0);
  const pending = bookings.filter((b) => b.status === "PENDING");
  const upcoming = bookings.filter((b) => ["AWAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(b.status));
  const history = bookings.filter((b) => ["COMPLETED", "CANCELLED", "DECLINED"].includes(b.status)).reverse().slice(0, 10);

  return (
    <div className="container-app py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading text-3xl">Espace propriétaire</h1>
        <Link href="/proprietaire/vehicules/nouveau" className="btn-accent">+ Ajouter un véhicule</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Gagné ce mois-ci" value={euros(earnedThisMonth)} />
        <Stat label="Revenus à venir" value={euros(upcomingEarnings)} />
        <Stat label="Total gagné" value={euros(totalEarned)} />
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Votre note</p>
          <div className="mt-2"><Stars value={rating.avg} count={rating.count} size="md" /></div>
        </div>
      </div>
      {!user.iban && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ajoutez votre IBAN dans <Link href="/compte" className="font-semibold underline">votre profil</Link> pour recevoir vos virements (sous 3 jours ouvrés après chaque location).
        </p>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Demandes à traiter ({pending.length})</h2>
          <div className="space-y-3">{pending.map((b) => <BookingRow key={b.id} b={b} asOwner />)}</div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Locations à venir</h2>
        <div className="space-y-3">
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">Aucune location prévue pour l&apos;instant.</p> : upcoming.map((b) => <BookingRow key={b.id} b={b} asOwner />)}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Mes véhicules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/proprietaire/vehicules/${v.id}`} className="card overflow-hidden hover:shadow-md">
              <div className="aspect-[16/9] bg-lagon-50">
                <VehicleImage photo={v.photos[0]?.url} category={v.category} color={v.color} alt={vehicleName(v)} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{vehicleName(v)}</p>
                  <p className="text-sm text-slate-500">{euros(v.pricePerDay)} / jour · {v._count.bookings} location(s)</p>
                </div>
                <span className={`chip ${v.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : ""}`}>{VEHICLE_STATUS[v.status] ?? v.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Historique récent</h2>
          <div className="space-y-3">{history.map((b) => <BookingRow key={b.id} b={b} asOwner />)}</div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

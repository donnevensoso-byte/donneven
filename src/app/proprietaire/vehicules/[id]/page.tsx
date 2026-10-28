import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { takenRanges } from "@/lib/queries";
import { busyDays } from "@/lib/availability";
import { dayInZone, formatDate } from "@/lib/dates";
import { getTerritory } from "@/lib/territories";
import { vehicleName } from "@/lib/format";
import { toFormValues } from "@/lib/vehicle-form";
import { addBlock, deletePhoto, makeCoverPhoto, removeBlock, setVehicleStatus, updateVehicle } from "@/app/actions/vehicles";
import { VehicleForm } from "@/components/forms/VehicleForm";
import { BlockForm } from "@/components/forms/BlockForm";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { BookingRow } from "@/components/BookingRow";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Gérer mon annonce" };

export default async function ManageVehiclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> }) {
  const { id } = await params;
  const { cree } = await searchParams;
  const user = await requireUser(`/proprietaire/vehicules/${id}`);
  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      blocks: { where: { endAt: { gt: new Date() } }, orderBy: { startAt: "asc" } },
      bookings: {
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"] } },
        include: { renter: { select: { firstName: true } } },
        orderBy: { startAt: "asc" },
      },
    },
  });
  if (!v || (v.ownerId !== user.id && user.role !== "ADMIN")) notFound();
  const territory = getTerritory(v.territory);
  const taken = await takenRanges(v.id);

  return (
    <div className="container-app max-w-4xl space-y-6 py-8">
      <Link href="/proprietaire" className="text-sm font-medium text-lagon-700 hover:underline">← Espace propriétaire</Link>
      {cree && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">🎉 Votre annonce est en ligne ! Ajoutez de belles photos pour attirer plus de locataires.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading text-3xl">{vehicleName(v)}</h1>
          <p className="text-slate-500">{v.commune}, {territory.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/vehicules/${v.id}`} className="btn-outline">Voir l&apos;annonce</Link>
          {v.status === "SUSPENDED" ? (
            <span className="chip bg-red-100 text-red-700">Suspendue par la modération</span>
          ) : (
            <form action={setVehicleStatus.bind(null, v.id, v.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}>
              <SubmitButton className={v.status === "ACTIVE" ? "btn-ghost" : "btn-primary"}>
                {v.status === "ACTIVE" ? "⏸ Mettre en pause" : "▶ Remettre en ligne"}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {v.bookings.length > 0 && (
        <section className="card space-y-3 p-5">
          <h2 className="heading text-xl">Réservations en cours</h2>
          {v.bookings.map((b) => <BookingRow key={b.id} b={{ ...b, vehicle: v }} asOwner />)}
        </section>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="heading text-xl">Calendrier</h2>
        <AvailabilityCalendar busy={[...busyDays(taken, territory.timeZone)]} today={dayInZone(new Date(), v.territory)} />
        <BlockForm action={addBlock.bind(null, v.id)} today={dayInZone(new Date(), v.territory)} />
        {v.blocks.length > 0 && (
          <ul className="space-y-2 text-sm">
            {v.blocks.map((bl) => (
              <li key={bl.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Du {formatDate(bl.startAt, v.territory)} au {formatDate(bl.endAt, v.territory)}{bl.reason ? ` · ${bl.reason}` : ""}</span>
                <form action={removeBlock.bind(null, v.id, bl.id)}><button className="text-red-600 hover:underline">Débloquer</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {v.photos.length > 0 && (
        <section className="card p-5">
          <h2 className="heading text-xl">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {v.photos.map((p, i) => (
              <div key={p.id} className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                <div className="flex justify-between bg-white px-2 py-1.5 text-xs">
                  {i === 0 ? <span className="font-semibold text-lagon-700">Couverture</span> : (
                    <form action={makeCoverPhoto.bind(null, v.id, p.id)}><button className="hover:underline">En couverture</button></form>
                  )}
                  <form action={deletePhoto.bind(null, v.id, p.id)}><button className="text-red-600 hover:underline">Supprimer</button></form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <VehicleForm action={updateVehicle.bind(null, v.id)} initial={toFormValues(v)} submitLabel="Enregistrer les modifications" />
    </div>
  );
}

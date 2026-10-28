import Link from "next/link";
import { formatDateTime } from "@/lib/dates";
import { euros, vehicleName } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { VehicleImage } from "./VehicleImage";

type Row = {
  id: string;
  status: string;
  startAt: Date;
  endAt: Date;
  total: number;
  ownerPayout: number;
  vehicle: { make: string; model: string; category: string; color: string; territory: string; commune: string; photos: { url: string }[] };
  renter?: { firstName: string };
};

export function BookingRow({ b, asOwner = false }: { b: Row; asOwner?: boolean }) {
  return (
    <Link href={`/reservations/${b.id}`} className="card flex items-center gap-4 overflow-hidden p-3 transition hover:shadow-md">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-lagon-50">
        <VehicleImage photo={b.vehicle.photos[0]?.url} category={b.vehicle.category} color={b.vehicle.color} alt={vehicleName(b.vehicle)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{vehicleName(b.vehicle)}</p>
          <StatusBadge status={b.status} />
        </div>
        <p className="truncate text-sm capitalize text-slate-500">
          {formatDateTime(b.startAt, b.vehicle.territory)} → {formatDateTime(b.endAt, b.vehicle.territory)}
        </p>
        <p className="text-xs text-slate-400">
          {asOwner && b.renter ? `Locataire : ${b.renter.firstName} · ` : ""}{b.vehicle.commune}
        </p>
      </div>
      <p className="shrink-0 text-right font-semibold">{euros(asOwner ? b.ownerPayout : b.total)}</p>
    </Link>
  );
}

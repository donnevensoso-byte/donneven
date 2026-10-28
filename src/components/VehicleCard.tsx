import Link from "next/link";
import { CATEGORIES, TRANSMISSIONS, type Category, type Transmission } from "@/lib/constants";
import { euros } from "@/lib/format";
import { VehicleImage } from "./VehicleImage";
import { Stars } from "./Stars";
import { Icon } from "./Icon";
import { FavoriteButton } from "./FavoriteButton";

export type CardVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  seats: number;
  color: string;
  commune: string;
  pricePerDay: number;
  instantBooking: boolean;
  airportDelivery: boolean;
  airConditioning: boolean;
  photos: { url: string }[];
  rating: { avg: number; count: number };
  distance?: number;
};

export function VehicleCard({
  v,
  favorite,
  loggedIn,
  query = "",
  days,
}: {
  v: CardVehicle;
  favorite?: boolean;
  loggedIn?: boolean;
  query?: string;
  days?: number;
}) {
  return (
    <div className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton vehicleId={v.id} initial={Boolean(favorite)} loggedIn={Boolean(loggedIn)} />
      </div>
      <Link href={`/vehicules/${v.id}${query}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-lagon-50">
          <VehicleImage photo={v.photos[0]?.url} category={v.category} color={v.color} alt={`${v.make} ${v.model}`} className="transition duration-500 group-hover:scale-105" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {v.instantBooking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-lagon-700">
                <Icon name="bolt" className="h-3.5 w-3.5" /> Instantanée
              </span>
            )}
            {v.airportDelivery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-sky-700">
                <Icon name="plane" className="h-3.5 w-3.5" /> Aéroport
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{v.make} {v.model}</h3>
              <p className="text-sm text-slate-500">
                {v.year} · {v.commune}
                {v.distance !== undefined && v.distance > 0.5 ? ` · ${v.distance.toFixed(0)} km` : ""}
              </p>
            </div>
            <Stars value={v.rating.avg} count={v.rating.count} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="chip">{CATEGORIES[v.category as Category]?.label}</span>
            <span className="chip">{TRANSMISSIONS[v.transmission as Transmission]}</span>
            {v.category !== "SCOOTER" && <span className="chip">{v.seats} places</span>}
            {v.airConditioning && v.category !== "SCOOTER" && <span className="chip">Clim</span>}
          </div>
          <p className="pt-1">
            <span className="text-lg font-bold">{euros(v.pricePerDay)}</span>
            <span className="text-sm text-slate-500"> / jour</span>
            {days && days > 1 ? <span className="ml-2 text-sm text-slate-500">· {euros(v.pricePerDay * days)} au total*</span> : null}
          </p>
        </div>
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { searchVehicles } from "@/lib/queries";
import { parseSearchParams, type RawParams } from "@/lib/search-params";
import { billableDays } from "@/lib/pricing";
import { getTerritory } from "@/lib/territories";
import { euros, plural } from "@/lib/format";
import { SearchForm } from "@/components/SearchForm";
import { FiltersBar } from "@/components/FiltersBar";
import { VehicleCard } from "@/components/VehicleCard";
import { ResultsView } from "@/components/ResultsView";

export async function generateMetadata({ searchParams }: { searchParams: Promise<RawParams> }): Promise<Metadata> {
  const f = parseSearchParams(await searchParams);
  return { title: `Location de voiture entre particuliers en ${getTerritory(f.territory).name}` };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const filters = parseSearchParams(await searchParams);
  const territory = getTerritory(filters.territory);
  const [results, user] = await Promise.all([searchVehicles(filters), getCurrentUser()]);
  const favorites = user
    ? new Set((await prisma.favorite.findMany({ where: { userId: user.id }, select: { vehicleId: true } })).map((f) => f.vehicleId))
    : new Set<string>();

  const days = filters.startAt && filters.endAt ? billableDays(filters.startAt, filters.endAt) : undefined;
  // on transmet les dates à la fiche véhicule pour pré-remplir la réservation
  const carry = new URLSearchParams();
  for (const k of ["debut", "fin", "hdebut", "hfin"]) if (filters.raw[k]) carry.set(k, filters.raw[k]);
  if (filters.delivery) carry.set("livraison", filters.delivery);
  const query = carry.size ? `?${carry}` : "";

  const where = filters.delivery
    ? territory.hubs.find((h) => h.kind === filters.delivery)?.name
    : filters.commune ?? territory.name;

  return (
    <div className="container-app py-6">
      <SearchForm defaults={filters.raw} compact />
      <div className="mt-4">
        <Suspense>
          <FiltersBar territory={filters.territory} />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="heading text-2xl">
          {plural(results.length, "véhicule disponible", "véhicules disponibles")} · {where}
        </h1>
        {days && <p className="text-sm text-slate-500">{plural(days, "jour")} de location</p>}
      </div>

      {territory.id === "guyane" && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          🌳 Astuce Guyane : pour les pistes et les longues distances (Saint-Laurent, Saint-Georges), filtrez les véhicules « Pistes autorisées » et vérifiez le kilométrage inclus.
        </p>
      )}

      {results.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-4xl">🏝️</p>
          <p className="mt-3 font-semibold">Aucun véhicule ne correspond à votre recherche.</p>
          <p className="mt-1 text-slate-500">Essayez d&apos;élargir les dates, de retirer des filtres ou de chercher sur tout le territoire.</p>
        </div>
      ) : (
        <ResultsView
          center={territory.center}
          zoom={territory.zoom}
          points={results.map((v) => ({
            id: v.id,
            lat: v.lat,
            lng: v.lng,
            label: euros(v.pricePerDay),
            title: `${v.make} ${v.model}`,
            href: `/vehicules/${v.id}${query}`,
          }))}
        >
          {results.map((v) => (
            <VehicleCard key={v.id} v={v} favorite={favorites.has(v.id)} loggedIn={Boolean(user)} query={query} days={days} />
          ))}
        </ResultsView>
      )}
      {days && results.length > 0 && <p className="mt-4 text-xs text-slate-500">* Prix de location hors assurance, frais de service et remises longue durée.</p>}
    </div>
  );
}

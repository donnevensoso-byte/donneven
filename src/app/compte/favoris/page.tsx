import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { vehicleRatings } from "@/lib/queries";
import { VehicleCard } from "@/components/VehicleCard";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const user = await requireUser("/compte/favoris");
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, vehicle: { status: "ACTIVE" } },
    include: { vehicle: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });
  const ratings = await vehicleRatings(favorites.map((f) => f.vehicleId));
  return (
    <div className="container-app py-8">
      <h1 className="heading text-3xl">Mes favoris</h1>
      {favorites.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-4xl">❤️</p>
          <p className="mt-3 font-semibold">Aucun favori pour l&apos;instant</p>
          <p className="mt-1 text-slate-500">Touchez le cœur sur un véhicule pour le retrouver ici.</p>
          <Link href="/recherche" className="btn-primary mt-5">Explorer</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <VehicleCard key={f.vehicleId} v={{ ...f.vehicle, rating: ratings.get(f.vehicleId) ?? { avg: 0, count: 0 } }} favorite loggedIn />
          ))}
        </div>
      )}
    </div>
  );
}

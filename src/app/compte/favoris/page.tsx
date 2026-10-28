import type { Metadata } from "next";
import { ListingGrid } from "@/components/listing-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listFavorites } from "@/lib/services/favorites";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const user = await requireUser("/compte/favoris");
  const favorites = await listFavorites(user.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="Mes favoris" />
      {favorites.length === 0 ? (
        <EmptyState icon="❤️" title="Aucun favori" action={{ href: "/recherche", label: "Parcourir les annonces" }}>
          Enregistrez les annonces qui vous intéressent pour les retrouver facilement.
        </EmptyState>
      ) : (
        <ListingGrid listings={favorites} />
      )}
    </div>
  );
}

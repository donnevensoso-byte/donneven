"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/vehicles";
import { Icon } from "./Icon";

export function FavoriteButton({ vehicleId, initial, loggedIn }: { vehicleId: string; initial: boolean; loggedIn: boolean }) {
  const [fav, setFav] = useOptimistic(initial);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!loggedIn) return router.push(`/connexion?suite=/vehicules/${vehicleId}`);
        start(async () => {
          setFav(!fav);
          await toggleFavorite(vehicleId);
          router.refresh();
        });
      }}
      className="rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition hover:scale-105"
    >
      <Icon name="heart" className={`h-5 w-5 ${fav ? "text-flamboyant-500" : "text-slate-400"}`} />
    </button>
  );
}

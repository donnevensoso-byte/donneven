"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/constants";

export function FiltersBar({ territory }: { territory: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const toggle = (key: string) => set(key, params.get(key) === "1" ? "" : "1");
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-lagon-600 bg-lagon-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-lagon-500"}`;
  const select = "shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700";

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <select aria-label="Catégorie" className={select} value={params.get("categorie") ?? ""} onChange={(e) => set("categorie", e.target.value)}>
        <option value="">Tous types</option>
        {CATEGORY_IDS.map((c) => (
          <option key={c} value={c}>{CATEGORIES[c].label}</option>
        ))}
      </select>
      <select aria-label="Boîte de vitesses" className={select} value={params.get("boite") ?? ""} onChange={(e) => set("boite", e.target.value)}>
        <option value="">Boîte : toutes</option>
        <option value="AUTOMATIQUE">Automatique</option>
        <option value="MANUELLE">Manuelle</option>
      </select>
      <select aria-label="Prix maximum" className={select} value={params.get("prixMax") ?? ""} onChange={(e) => set("prixMax", e.target.value)}>
        <option value="">Prix max</option>
        {[25, 35, 50, 75, 100].map((p) => (
          <option key={p} value={p}>≤ {p} € / jour</option>
        ))}
      </select>
      <select aria-label="Nombre de places" className={select} value={params.get("places") ?? ""} onChange={(e) => set("places", e.target.value)}>
        <option value="">Places</option>
        <option value="4">4 places et +</option>
        <option value="5">5 places et +</option>
        <option value="7">7 places et +</option>
      </select>
      <button type="button" className={chip(params.get("instant") === "1")} onClick={() => toggle("instant")}>⚡ Réservation instantanée</button>
      <button type="button" className={chip(params.get("livraison") === "AEROPORT" || params.get("lieu") === "h:AEROPORT")} onClick={() => {
        const next = new URLSearchParams(params.toString());
        const on = next.get("livraison") === "AEROPORT" || next.get("lieu") === "h:AEROPORT";
        next.delete("lieu");
        if (on) next.delete("livraison"); else next.set("livraison", "AEROPORT");
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}>✈︎ Livré à l&apos;aéroport</button>
      {territory === "guadeloupe" && (
        <button type="button" className={chip(params.get("ferry") === "1")} onClick={() => toggle("ferry")}>⛴ Autorisé sur ferry</button>
      )}
      {territory === "guyane" && (
        <button type="button" className={chip(params.get("piste") === "1")} onClick={() => toggle("piste")}>🌳 Pistes autorisées</button>
      )}
      <select aria-label="Trier par" className={select} value={params.get("tri") ?? ""} onChange={(e) => set("tri", e.target.value)}>
        <option value="">Trier : pertinence</option>
        <option value="prix">Prix croissant</option>
        <option value="note">Mieux notés</option>
        <option value="distance">Les plus proches</option>
      </select>
    </div>
  );
}

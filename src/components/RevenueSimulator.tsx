"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_IDS, FEES, PRICE_HINTS, type Category } from "@/lib/constants";
import { TERRITORIES } from "@/lib/territories";
import { euros } from "@/lib/format";

/** Saisonnalité touristique : haute saison de décembre à avril + juillet/août. */
const SEASON_FACTOR: Record<string, number> = { haute: 1.15, basse: 0.9 };

export function RevenueSimulator() {
  const [territory, setTerritory] = useState("guadeloupe");
  const [category, setCategory] = useState<Category>("CITADINE");
  const [days, setDays] = useState(10);
  const [season, setSeason] = useState<"haute" | "basse">("haute");
  const [low, high] = PRICE_HINTS[category];
  const price = Math.round(((low + high) / 2) * SEASON_FACTOR[season] * (territory === "saint-barthelemy" ? 1.6 : 1));
  const monthly = Math.round(price * days * 100 * (1 - FEES.ownerCommissionPct / 100));

  return (
    <div className="card grid gap-6 p-6 md:grid-cols-2 md:p-8">
      <div className="space-y-4">
        <label className="block">
          <span className="label">Territoire</span>
          <select className="input" value={territory} onChange={(e) => setTerritory(e.target.value)}>
            {TERRITORIES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Type de véhicule</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORY_IDS.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Jours loués par mois : {days}</span>
          <input type="range" min={2} max={25} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-lagon-600" />
        </label>
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
          {(["haute", "basse"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSeason(s)} className={`rounded-full px-4 py-1.5 font-semibold ${season === s ? "bg-white shadow-sm" : "text-slate-500"}`}>
              Saison {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-2xl bg-lagon-600 p-6 text-white">
        <p className="text-sm text-white/80">Vous pourriez gagner jusqu&apos;à</p>
        <p className="font-display text-5xl font-semibold">{euros(monthly)}</p>
        <p className="text-sm text-white/80">par mois, soit {euros(monthly * 12)} par an</p>
        <p className="mt-4 text-xs text-white/70">
          Estimation basée sur {price} € / jour, après commission Woulé de {FEES.ownerCommissionPct} % (assurance et assistance incluses).
        </p>
      </div>
    </div>
  );
}

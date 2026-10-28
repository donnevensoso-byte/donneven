"use client";

import { useState } from "react";
import { TERRITORIES, getTerritory } from "@/lib/territories";
import { HOURS } from "@/lib/dates";
import { Icon } from "./Icon";

type Props = {
  defaults?: Record<string, string>;
  compact?: boolean;
  /** champs supplémentaires conservés lors d'une nouvelle recherche (filtres) */
  hidden?: Record<string, string>;
};

export function SearchForm({ defaults = {}, compact = false, hidden = {} }: Props) {
  const [territory, setTerritory] = useState(defaults.territoire || "guadeloupe");
  const [start, setStart] = useState(defaults.debut || "");
  const t = getTerritory(territory);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action="/recherche" method="get" className={`card grid gap-3 p-3 ${compact ? "md:grid-cols-[1.1fr_1.2fr_1fr_1fr_auto]" : "md:grid-cols-[1fr_1.2fr_1fr_1fr_auto] md:p-4"}`}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Field label="Territoire">
        <select name="territoire" className="input" value={territory} onChange={(e) => setTerritory(e.target.value)}>
          {TERRITORIES.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Où ?">
        <select name="lieu" className="input" defaultValue={defaultPlace(defaults)} key={territory}>
          <option value="">Tout le territoire</option>
          <optgroup label="Livraison">
            {t.hubs.map((h) => (
              <option key={h.id} value={`h:${h.kind}`}>
                {h.kind === "AEROPORT" ? "✈︎" : "⚓"} {h.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Communes">
            {t.communes.map((c) => (
              <option key={c.name} value={`c:${c.name}`} disabled={c.roadAccess === false}>
                {c.name}{c.island ? ` (${c.island})` : ""}{c.roadAccess === false ? " — non reliée par la route" : ""}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <Field label="Départ">
        <div className="flex gap-1.5">
          <input type="date" name="debut" min={today} className="input min-w-0" value={start} onChange={(e) => setStart(e.target.value)} />
          <select name="hdebut" className="input w-24 shrink-0 px-2" defaultValue={defaults.hdebut || "10:00"} aria-label="Heure de départ">
            {HOURS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
      </Field>
      <Field label="Retour">
        <div className="flex gap-1.5">
          <input type="date" name="fin" min={start || today} className="input min-w-0" defaultValue={defaults.fin || ""} />
          <select name="hfin" className="input w-24 shrink-0 px-2" defaultValue={defaults.hfin || "10:00"} aria-label="Heure de retour">
            {HOURS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
      </Field>
      <div className="flex items-end">
        <button className="btn-accent h-[42px] w-full md:w-auto" type="submit">
          <Icon name="search" className="h-4 w-4" /> Rechercher
        </button>
      </div>
    </form>
  );
}

function defaultPlace(d: Record<string, string>) {
  if (d.lieu) return d.lieu;
  if (d.livraison) return `h:${d.livraison}`;
  if (d.commune) return `c:${d.commune}`;
  return "";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

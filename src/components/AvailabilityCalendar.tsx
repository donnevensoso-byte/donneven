"use client";

import { useState } from "react";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/** Calendrier mensuel des disponibilités (jours AAAA-MM-JJ occupés). */
export function AvailabilityCalendar({ busy, today }: { busy: string[]; today: string }) {
  const busySet = new Set(busy);
  const [offset, setOffset] = useState(0);
  const [y, m] = today.split("-").map(Number);
  const months = [0, 1].map((i) => {
    const d = new Date(Date.UTC(y, m - 1 + offset + i, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="btn-ghost px-3 py-1" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Mois précédent">←</button>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-white ring-1 ring-slate-300" /> Disponible</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-200" /> Indisponible</span>
        </div>
        <button type="button" className="btn-ghost px-3 py-1" onClick={() => setOffset((o) => Math.min(10, o + 1))} aria-label="Mois suivant">→</button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {months.map(({ year, month }) => {
          const first = new Date(Date.UTC(year, month, 1));
          const lead = (first.getUTCDay() + 6) % 7;
          const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
          return (
            <div key={`${year}-${month}`}>
              <p className="mb-2 text-center text-sm font-semibold capitalize">
                {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {WEEKDAYS.map((w, i) => (
                  <span key={i} className="py-1 font-semibold text-slate-400">{w}</span>
                ))}
                {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
                {Array.from({ length: count }, (_, i) => {
                  const day = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                  const past = day < today;
                  const taken = busySet.has(day);
                  return (
                    <span
                      key={day}
                      className={`rounded-md py-1.5 ${past ? "text-slate-300" : taken ? "bg-slate-200 text-slate-400 line-through" : "bg-white text-encre ring-1 ring-slate-200"}`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

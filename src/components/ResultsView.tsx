"use client";

import { useState } from "react";
import { ResultsMap } from "./Maps";
import type { MapPoint } from "./MapView";

/** Liste + carte côte à côte sur ordinateur, bascule Liste / Carte sur mobile. */
export function ResultsView({ center, zoom, points, children }: { center: [number, number]; zoom: number; points: MapPoint[]; children: React.ReactNode }) {
  const [mode, setMode] = useState<"liste" | "carte">("liste");
  return (
    <div className="mt-4">
      <div className="mb-4 inline-flex rounded-full bg-slate-100 p-1 lg:hidden">
        {(["liste", "carte"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${mode === m ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className={`grid content-start gap-5 sm:grid-cols-2 ${mode === "carte" ? "hidden lg:grid" : ""}`}>{children}</div>
        <div className={`h-[70vh] lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] ${mode === "liste" ? "hidden" : ""}`}>
          {/* remonté au changement de mode pour que Leaflet recalcule sa taille */}
          <ResultsMap key={mode} center={center} zoom={zoom} points={points} />
        </div>
      </div>
    </div>
  );
}

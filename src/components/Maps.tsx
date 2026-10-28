"use client";

import dynamic from "next/dynamic";

const loading = () => <div className="h-full w-full animate-pulse rounded-2xl bg-lagon-50" />;

// Leaflet a besoin de `window` : chargement uniquement côté navigateur
export const ResultsMap = dynamic(() => import("./MapView").then((m) => m.ResultsMap), { ssr: false, loading });
export const AreaMap = dynamic(() => import("./MapView").then((m) => m.AreaMap), { ssr: false, loading });
export const PickerMap = dynamic(() => import("./MapView").then((m) => m.PickerMap), { ssr: false, loading });

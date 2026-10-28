"use client";

import dynamic from "next/dynamic";

const placeholder = () => <div className="size-full animate-pulse bg-line" aria-hidden />;

// Leaflet a besoin de `window` : rendu uniquement côté navigateur.
export const ListingsMap = dynamic(() => import("./listings-map-inner"), { ssr: false, loading: placeholder });
export const AreaMap = dynamic(() => import("./area-map-inner"), { ssr: false, loading: placeholder });
export const LocationPicker = dynamic(() => import("./location-picker-inner"), { ssr: false, loading: placeholder });

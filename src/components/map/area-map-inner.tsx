"use client";

import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, TileLayer } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "./tiles";

/** Zone approximative (cercle) : l'adresse exacte n'est jamais affichée. */
export default function AreaMapInner({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="size-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Circle center={[lat, lng]} radius={600} pathOptions={{ color: "#0b6e4f", fillColor: "#12875f", fillOpacity: 0.2 }} />
    </MapContainer>
  );
}

"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { GUYANE_CENTER } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import { TILE_ATTRIBUTION, TILE_URL } from "./tiles";

export type MapListing = { id: string; title: string; lat: number; lng: number; dayPrice: number };

function priceIcon(price: number) {
  return L.divIcon({
    className: "",
    html: `<span style="display:inline-block;transform:translate(-50%,-50%);white-space:nowrap;background:var(--color-surface);color:var(--color-text);border:1px solid var(--color-border);border-radius:999px;padding:2px 8px;font:600 12px/18px var(--font-sans);box-shadow:var(--shadow-pop)">${formatEuros(price)}</span>`,
    iconSize: [0, 0],
  });
}

function FitBounds({ listings }: { listings: MapListing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [listings, map]);
  return null;
}

export default function ListingsMapInner({ listings }: { listings: MapListing[] }) {
  return (
    <MapContainer center={[GUYANE_CENTER.lat, GUYANE_CENTER.lng]} zoom={7} scrollWheelZoom className="size-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitBounds listings={listings} />
      {listings.map((l) => (
        <Marker key={l.id} position={[l.lat, l.lng]} icon={priceIcon(l.dayPrice)}>
          <Popup>
            <a href={`/annonces/${l.id}`} className="font-semibold">
              {l.title}
            </a>
            <br />
            {formatEuros(l.dayPrice)} / jour
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

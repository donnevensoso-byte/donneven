"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Circle, useMapEvents, Tooltip } from "react-leaflet";
import Link from "next/link";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  href?: string;
  title?: string;
};

function priceIcon(label: string, active = false) {
  return L.divIcon({
    className: "",
    html: `<span class="price-marker${active ? " is-active" : ""}">${label}</span>`,
    iconSize: [0, 0],
  });
}

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="40" viewBox="0 0 24 30" style="transform:translate(-50%,-100%)"><path d="M12 0a10 10 0 00-10 10c0 7.5 10 20 10 20s10-12.5 10-20A10 10 0 0012 0z" fill="#e44a24"/><circle cx="12" cy="10" r="4" fill="#fff"/></svg>`,
  iconSize: [0, 0],
});

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Carte des résultats de recherche avec un marqueur de prix par véhicule. */
export function ResultsMap({ center, zoom, points, activeId }: { center: [number, number]; zoom: number; points: MapPoint[]; activeId?: string }) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full rounded-2xl">
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={priceIcon(p.label, p.id === activeId)}>
          {p.title && (
            <Tooltip direction="top" offset={[0, -12]}>
              {p.href ? <Link href={p.href}>{p.title}</Link> : p.title}
            </Tooltip>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}

/** Zone approximative d'un véhicule (l'adresse exacte n'est communiquée qu'après confirmation). */
export function AreaMap({ center, exact = false }: { center: [number, number]; exact?: boolean }) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full rounded-2xl">
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      {exact ? (
        <Marker position={center} icon={pinIcon} />
      ) : (
        <Circle center={center} radius={600} pathOptions={{ color: "#0b8379", fillColor: "#14a394", fillOpacity: 0.2 }} />
      )}
    </MapContainer>
  );
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Sélection de l'emplacement de stationnement dans le formulaire d'annonce. */
export function PickerMap({
  center,
  zoom,
  value,
  onPick,
}: {
  center: [number, number];
  zoom: number;
  value: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer key={center.join(",")} center={value ?? center} zoom={zoom} className="h-full w-full rounded-2xl">
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      <ClickHandler onPick={onPick} />
      {value && <Marker position={value} icon={pinIcon} />}
    </MapContainer>
  );
}

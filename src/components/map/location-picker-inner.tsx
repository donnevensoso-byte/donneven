"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "./tiles";

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;transform:translate(-50%,-100%);font-size:30px;line-height:30px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))">📍</span>`,
  iconSize: [0, 0],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

export default function LocationPickerInner({
  center,
  value,
  onPick,
}: {
  center: { lat: number; lng: number };
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} className="size-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Recenter lat={center.lat} lng={center.lng} />
      <ClickHandler onPick={onPick} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onPick(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}

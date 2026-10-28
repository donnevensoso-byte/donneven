import { getTerritory } from "./territories";

/** Construit une date à partir d'un jour (AAAA-MM-JJ) et d'une heure (HH:MM) dans le fuseau du territoire. */
export function zonedDate(territoryId: string, day: string, time = "10:00"): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${day}T${time}:00${getTerritory(territoryId).utcOffset}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Jour (AAAA-MM-JJ) d'une date dans le fuseau du territoire. */
export function dayInZone(date: Date, territoryId: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getTerritory(territoryId).timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function timeInZone(date: Date, territoryId: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: getTerritory(territoryId).timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(date: Date, territoryId: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: getTerritory(territoryId).timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(date: Date, territoryId?: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: territoryId ? getTerritory(territoryId).timeZone : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const HOURS = Array.from({ length: 31 }, (_, i) => {
  const h = 6 + Math.floor(i / 2);
  const m = i % 2 ? "30" : "00";
  return `${String(h).padStart(2, "0")}:${m}`;
});

import { TIMEZONE } from "./guyane";

const DAY_MS = 86_400_000;

/** Date du jour en Guyane au format AAAA-MM-JJ. */
export function todayInGuyane(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(now);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Nombre de jours de location, bornes incluses (du 3 au 5 = 3 jours). */
export function rentalDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.round((end - start) / DAY_MS) + 1;
}

/** Deux périodes [aStart, aEnd] et [bStart, bEnd] (bornes incluses) se chevauchent-elles ? */
export function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function formatDate(isoDate: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return `le ${formatDate(start, { weekday: "long" })}`;
  return `du ${formatDate(start)} au ${formatDate(end, { year: "numeric" })}`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: TIMEZONE }).format(date);
}

export function timeAgo(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatDateTime(date);
}

/** Minuit à la fin du jour donné, heure de Guyane (UTC−3). */
export function endOfDayInGuyane(isoDate: string): Date {
  return new Date(`${addDays(isoDate, 1)}T03:00:00Z`);
}

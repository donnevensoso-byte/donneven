import { BOOKING_STATUSES, type BookingStatus } from "@/lib/constants";

const TONES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
  green: "bg-emerald-100 text-emerald-800",
  teal: "bg-lagon-100 text-lagon-800",
  slate: "bg-slate-100 text-slate-700",
  red: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const s = BOOKING_STATUSES[status as BookingStatus] ?? { label: status, tone: "slate" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[s.tone]}`}>{s.label}</span>;
}

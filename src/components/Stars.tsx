export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  if (count === 0) return <span className="text-xs font-medium text-lagon-700">Nouveau</span>;
  return (
    <span className={`inline-flex items-center gap-1 ${size === "md" ? "text-base" : "text-sm"}`}>
      <svg viewBox="0 0 20 20" className={size === "md" ? "h-5 w-5" : "h-4 w-4"} fill="#f59e0b" aria-hidden>
        <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
      </svg>
      <span className="font-semibold">{value.toFixed(1).replace(".", ",")}</span>
      {count !== undefined && <span className="text-slate-500">({count})</span>}
    </span>
  );
}

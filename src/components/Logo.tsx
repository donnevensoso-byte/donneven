import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Woulé, accueil">
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#0b8379" />
        <path d="M6 26 Q14 20 20 25 T34 23" stroke="#ffd27a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M9 21 L13 13 L17 19 L20 12 L23 19 L27 13 L31 21" stroke="#fff" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className={`font-display text-2xl font-semibold tracking-tight ${light ? "text-white" : "text-encre"}`}>
        Woulé
      </span>
    </Link>
  );
}

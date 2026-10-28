export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0b6e4f" />
      <path d="M17 19h30L23 45h24" fill="none" stroke="#f4c430" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47" cy="19" r="4" fill="#d9412b" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-brand-700">Zouti</span>
    </span>
  );
}

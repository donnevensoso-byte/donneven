/** Illustration vectorielle utilisée quand un véhicule n'a pas encore de photo. */
export function VehicleIllustration({ category, color = "#14a394", className = "" }: { category: string; color?: string; className?: string }) {
  const sky = "#d0f7ee";
  return (
    <svg viewBox="0 0 320 200" className={className} role="img" aria-label="Illustration du véhicule" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`sky-${category}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor="#fdf3e0" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#sky-${category})`} />
      <circle cx="262" cy="46" r="20" fill="#ffd27a" opacity="0.9" />
      <path d="M0 150 Q80 128 160 146 T320 140 V200 H0Z" fill="#f8e4bd" />
      <g transform="translate(250 92)">
        <path d="M0 58 C2 30 6 10 12 0" stroke="#7a5534" strokeWidth="4" fill="none" />
        <path d="M12 0 C-8 -4 -20 4 -26 12 M12 0 C30 -8 40 0 44 8 M12 0 C4 -18 16 -24 26 -22 M12 0 C0 -10 -14 -12 -20 -6" stroke="#2f9a5a" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
      {category === "SCOOTER" ? <Scooter color={color} /> : <Car color={color} category={category} />}
    </svg>
  );
}

function Wheel({ x, y, r = 17 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#1f2937" />
      <circle cx={x} cy={y} r={r * 0.45} fill="#cbd5e1" />
    </g>
  );
}

function Car({ color, category }: { color: string; category: string }) {
  const tall = ["SUV", "QUATRE_QUATRE", "MONOSPACE", "UTILITAIRE"].includes(category);
  const open = category === "CABRIOLET";
  const van = category === "UTILITAIRE";
  const body = tall
    ? "M40 140 L40 108 Q42 96 56 94 L92 92 L118 62 Q122 58 130 58 L230 58 Q244 58 250 70 L266 100 Q282 104 284 118 L284 140 Z"
    : "M36 142 L36 118 Q38 106 54 104 L96 100 L126 74 Q132 70 142 70 L208 70 Q220 70 228 80 L250 102 Q278 106 282 122 L282 142 Z";
  return (
    <g>
      <ellipse cx="160" cy="162" rx="128" ry="8" fill="#000" opacity="0.12" />
      <path d={van ? "M40 140 L40 70 Q40 58 54 58 L230 58 Q246 58 254 74 L270 104 Q284 108 284 122 L284 140 Z" : body} fill={color} />
      {!open && (
        <path
          d={
            van
              ? "M222 66 L240 66 Q246 66 250 74 L262 100 L222 100 Z"
              : tall
                ? "M124 66 L170 66 L170 92 L102 92 Z M178 66 L228 66 Q238 66 242 74 L254 92 L178 92 Z"
                : "M132 78 L172 78 L172 100 L108 100 Z M180 78 L206 78 Q216 78 222 86 L236 100 L180 100 Z"
          }
          fill="#e0f2fe"
          opacity="0.95"
        />
      )}
      {open && <path d="M120 100 L132 84 L140 84 L132 100 Z" fill="#334155" />}
      {category === "QUATRE_QUATRE" && <rect x="120" y="50" width="110" height="6" rx="3" fill="#334155" />}
      <rect x="270" y="118" width="12" height="6" rx="3" fill="#fde68a" />
      <rect x="38" y="120" width="8" height="6" rx="3" fill="#fca5a5" />
      <Wheel x={92} y={142} r={tall ? 19 : 17} />
      <Wheel x={232} y={142} r={tall ? 19 : 17} />
    </g>
  );
}

function Scooter({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx="160" cy="166" rx="90" ry="7" fill="#000" opacity="0.12" />
      <path d="M96 132 Q100 110 130 110 L176 110 Q186 92 196 70 L208 70 L200 98 Q228 104 232 132 Z" fill={color} />
      <rect x="112" y="98" width="52" height="12" rx="6" fill="#1f2937" />
      <path d="M200 70 L214 52 M206 54 L224 54" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
      <Wheel x={112} y={146} r={20} />
      <Wheel x={224} y={146} r={20} />
    </g>
  );
}

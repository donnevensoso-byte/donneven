import type { JSX } from "react";
import { CategoryIcon } from "./category-icon";

// Illustrations maison (les mêmes que sur les visuels Instagram) : elles remplacent la photo
// quand une annonce n'en a pas. Couleurs prises dans les tokens, jamais en dur.
const ink = "var(--color-text)";
const green = "var(--color-accent)";
const mango = "var(--color-sun)";
const mangoDark = "var(--color-sun-text)";
const white = "var(--color-surface)";
const grey = "var(--color-text-muted)";
const water = "var(--color-brand-200)";

function Shadow({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry="7" fill={ink} opacity=".12" />;
}

function Generator() {
  return (
    <>
      <Shadow cx={100} cy={178} rx={78} />
      <rect x="58" y="44" width="84" height="22" rx="10" fill={green} />
      <rect x="88" y="36" width="24" height="12" rx="4" fill={ink} />
      <rect x="32" y="62" width="136" height="88" rx="14" fill={mango} />
      <path d="M24 72v80M176 72v80M24 66h152" stroke={ink} strokeWidth="9" fill="none" strokeLinecap="round" />
      <rect x="48" y="80" width="62" height="50" rx="10" fill={ink} />
      <path d="M58 92h42M58 104h42M58 116h42" stroke={grey} strokeWidth="5" strokeLinecap="round" />
      <rect x="120" y="80" width="38" height="32" rx="6" fill={white} />
      <circle cx="131" cy="96" r="6" fill={green} />
      <circle cx="147" cy="96" r="6" fill={green} />
      <rect x="122" y="118" width="34" height="10" rx="5" fill={mangoDark} />
      <circle cx="52" cy="160" r="17" fill={ink} />
      <circle cx="52" cy="160" r="6" fill={white} />
      <circle cx="148" cy="160" r="17" fill={ink} />
      <circle cx="148" cy="160" r="6" fill={white} />
    </>
  );
}

function BrushCutter() {
  return (
    <>
      <Shadow cx={150} cy={182} rx={40} />
      <path d="M44 44L158 158" stroke={ink} strokeWidth="9" strokeLinecap="round" />
      <g transform="rotate(45 44 44)">
        <rect x="14" y="26" width="60" height="38" rx="12" fill={mango} />
        <rect x="22" y="34" width="20" height="22" rx="5" fill={ink} />
        <circle cx="62" cy="45" r="7" fill={white} />
      </g>
      <path d="M64 118L118 64" stroke={green} strokeWidth="10" strokeLinecap="round" />
      <circle cx="64" cy="118" r="10" fill={ink} />
      <circle cx="118" cy="64" r="10" fill={ink} />
      <path d="M140 176a34 34 0 0 1 40-40" stroke={mango} strokeWidth="10" fill="none" strokeLinecap="round" />
      <circle cx="162" cy="162" r="24" fill={green} />
      <circle cx="162" cy="162" r="9" fill={white} />
    </>
  );
}

function PressureWasher() {
  return (
    <>
      <Shadow cx={96} cy={180} rx={66} />
      <path d="M66 74V38h52v36" stroke={ink} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="48" y="70" width="90" height="88" rx="18" fill={green} />
      <rect x="62" y="86" width="40" height="24" rx="6" fill={white} />
      <circle cx="120" cy="98" r="9" fill={mango} />
      <circle cx="72" cy="164" r="15" fill={ink} />
      <circle cx="72" cy="164" r="5" fill={white} />
      <path d="M138 132c40 0 44 44 10 46s-36-30-4-48" stroke={ink} strokeWidth="6" fill="none" />
      <path d="M150 92l36-58" stroke={ink} strokeWidth="7" strokeLinecap="round" />
      <rect x="140" y="84" width="22" height="34" rx="6" fill={mango} transform="rotate(30 151 101)" />
    </>
  );
}

function Tent() {
  return (
    <>
      <Shadow cx={100} cy={176} rx={80} />
      <path d="M26 82L100 36l74 46z" fill={mango} />
      <path d="M100 36L74 82M100 36l26 46" stroke={white} strokeWidth="5" opacity=".7" />
      <path d="M26 82q12 16 24 0q12 16 24 0q13 16 26 0q12 16 24 0q12 16 24 0q12 16 26 0z" fill={mangoDark} />
      <path d="M34 90v84M166 90v84" stroke={ink} strokeWidth="7" strokeLinecap="round" />
      <rect x="66" y="130" width="68" height="10" rx="4" fill={green} />
      <path d="M74 140v32M126 140v32" stroke={green} strokeWidth="6" strokeLinecap="round" />
    </>
  );
}

function Kayak() {
  return (
    <>
      <path d="M10 150q90 22 180 0" stroke={water} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M16 118Q100 72 184 118Q100 152 16 118z" fill={mango} />
      <path d="M16 118Q100 132 184 118" stroke={mangoDark} strokeWidth="4" fill="none" />
      <ellipse cx="100" cy="110" rx="26" ry="10" fill={ink} />
      <path d="M44 56L156 168" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="40" cy="52" rx="10" ry="22" fill={green} transform="rotate(-45 40 52)" />
      <ellipse cx="160" cy="172" rx="10" ry="22" fill={green} transform="rotate(-45 160 172)" />
    </>
  );
}

function Drill() {
  return (
    <>
      <Shadow cx={92} cy={182} rx={50} />
      <path d="M36 64h96q22 0 22 22t-22 22H100l10 52H72l-6-52H36q-10 0-10-10V74q0-10 10-10z" fill={green} />
      <rect x="154" y="78" width="16" height="18" rx="3" fill={ink} />
      <path d="M170 87h22" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <rect x="58" y="156" width="64" height="22" rx="6" fill={mango} />
      <rect x="104" y="108" width="10" height="20" rx="4" fill={ink} />
      <circle cx="58" cy="86" r="10" fill={white} opacity=".85" />
    </>
  );
}

function Mixer() {
  return (
    <>
      <Shadow cx={100} cy={182} rx={74} />
      <path d="M52 62l74-22 34 74-74 26z" fill={mango} />
      <path d="M126 40l14-6 30 70-10 10" fill={mangoDark} />
      <ellipse cx="143" cy="72" rx="14" ry="40" fill={ink} transform="rotate(-24 143 72)" />
      <path d="M68 76l52-16M76 96l52-16M84 116l52-16" stroke={white} strokeWidth="4" opacity=".6" />
      <path d="M80 140l-30 38M120 128l30 50M60 160h80" stroke={green} strokeWidth="8" strokeLinecap="round" />
      <circle cx="152" cy="176" r="12" fill={ink} />
    </>
  );
}

const ART: Record<string, () => JSX.Element> = {
  energie: Generator,
  jardin: BrushCutter,
  nettoyage: PressureWasher,
  fete: Tent,
  fleuve: Kayak,
  bricolage: Drill,
  construction: Mixer,
};

/** Illustration de la catégorie, ou son icône en grand quand il n'y a pas d'illustration. */
export function CategoryArt({ slug, className = "size-2/3" }: { slug?: string | null; className?: string }) {
  const Art = slug ? ART[slug] : undefined;
  if (!Art) return <CategoryIcon slug={slug} className="size-1/3 text-brand-600" />;
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <Art />
    </svg>
  );
}

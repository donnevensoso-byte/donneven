// Génère src/app/tokens.css depuis replica/design/tokens.json (source de vérité du design).
// Usage : node scripts/design-tokens.mjs   (puis vérifier le contraste avec contrast.py)
// Rayons émis en --radius-token-* pour ne pas écraser rounded-sm/md/lg/xl de Tailwind.
import { readFileSync, writeFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync("replica/design/tokens.json", "utf8"));
const lines = ["/* Généré par scripts/design-tokens.mjs depuis replica/design/tokens.json. Ne pas modifier à la main. */", "@theme {"];
for (const [role, value] of Object.entries(tokens.color)) lines.push(`  --color-${role}: ${value};`);
for (const [name, px] of Object.entries(tokens.radius)) lines.push(`  --radius-token-${name}: ${px === 999 ? "9999px" : `${px / 16}rem`};`);
for (const [name, value] of Object.entries(tokens.shadow)) lines.push(`  --shadow-${name}: ${value};`);
lines.push(`  --ease-zouti: ${tokens.motion.ease};`);
lines.push("}", "");
writeFileSync("src/app/tokens.css", lines.join("\n"));
console.log(`tokens.css : ${Object.keys(tokens.color).length} couleurs, ${Object.keys(tokens.radius).length} rayons, ${Object.keys(tokens.shadow).length} ombres`);

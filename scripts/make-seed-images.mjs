// Génère les photos de démonstration (une fois, en développement). Nécessite une police emoji.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";
import { demoListings } from "./seed-data.ts";

await mkdir("scripts/seed-images", { recursive: true });
for (const l of demoListings) {
  const [a, b] = l.colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <circle cx="980" cy="160" r="260" fill="#fff" opacity=".08"/><circle cx="160" cy="820" r="300" fill="#000" opacity=".08"/>
    <text x="600" y="520" font-size="360" text-anchor="middle" font-family="Noto Color Emoji" fill="#ffffff" fill-opacity=".92">${l.emoji}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toFile(`scripts/seed-images/${l.key}.jpg`);
}
console.log(`${demoListings.length} images générées`);

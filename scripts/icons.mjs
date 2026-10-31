// Génère les icônes PNG de l'application (PWA, iOS) à partir du logo SVG.
import sharp from "sharp";

const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0b6e4f"/><path d="M17 19h30L23 45h24" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="19" r="4" fill="#ff8f5a"/></svg>`;
// Version « maskable » : fond plein et logo dans la zone de sécurité (80 %).
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#0b6e4f"/><g transform="translate(8 8)"><path d="M17 19h30L23 45h24" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="19" r="4" fill="#ff8f5a"/></g></svg>`;

for (const size of [192, 512]) {
  await sharp(Buffer.from(full)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  await sharp(Buffer.from(maskable)).resize(size, size).png().toFile(`public/icons/maskable-${size}.png`);
}
await sharp(Buffer.from(maskable)).resize(180, 180).png().toFile("src/app/apple-icon.png");
// Image de partage (Open Graph) 1200 × 630, servie par Next via src/app/opengraph-image.png.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#08583f"/>
  <circle cx="1080" cy="560" r="260" fill="#0b6e4f"/>
  <circle cx="140" cy="90" r="180" fill="#ff8f5a" opacity="0.18"/>
  <g transform="translate(96 150) scale(2.4)"><rect width="64" height="64" rx="16" fill="#0b6e4f" stroke="#ffffff" stroke-opacity="0.25"/><path d="M17 19h30L23 45h24" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="19" r="4" fill="#ff8f5a"/></g>
  <text x="290" y="250" font-family="Inter, DejaVu Sans, sans-serif" font-size="110" font-weight="800" fill="#ffffff">Zouti</text>
  <text x="96" y="420" font-family="Inter, DejaVu Sans, sans-serif" font-size="52" font-weight="700" fill="#ffffff">Louez le matériel de vos voisins</text>
  <text x="96" y="490" font-family="Inter, DejaVu Sans, sans-serif" font-size="36" fill="#ffffff" fill-opacity="0.88">Question gratuite · zéro commission en main propre · Guyane</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("src/app/opengraph-image.png");
console.log("Icônes générées");

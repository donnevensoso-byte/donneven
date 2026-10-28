// Génère les icônes PNG de l'application (PWA, iOS) à partir du logo SVG.
import sharp from "sharp";

const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0b6e4f"/><path d="M17 19h30L23 45h24" fill="none" stroke="#f4c430" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="19" r="4" fill="#d9412b"/></svg>`;
// Version « maskable » : fond plein et logo dans la zone de sécurité (80 %).
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#0b6e4f"/><g transform="translate(8 8)"><path d="M17 19h30L23 45h24" fill="none" stroke="#f4c430" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="19" r="4" fill="#d9412b"/></g></svg>`;

for (const size of [192, 512]) {
  await sharp(Buffer.from(full)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  await sharp(Buffer.from(maskable)).resize(size, size).png().toFile(`public/icons/maskable-${size}.png`);
}
await sharp(Buffer.from(maskable)).resize(180, 180).png().toFile("src/app/apple-icon.png");
console.log("Icônes générées");

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Woulé — Location de véhicules Antilles-Guyane",
    short_name: "Woulé",
    description: "Location de voitures entre particuliers en Guadeloupe, Martinique, Guyane, Saint-Martin et Saint-Barthélemy.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbf3",
    theme_color: "#0b8379",
    lang: "fr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

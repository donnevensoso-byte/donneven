import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} – location d'outils en Guyane`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: "#0b6e4f",
    categories: ["shopping", "lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Rechercher", url: "/recherche" },
      { name: "Proposer un outil", url: "/annonces/nouvelle" },
      { name: "Messages", url: "/messages" },
    ],
  };
}

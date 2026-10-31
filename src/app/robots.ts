import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";

// Lu à chaque requête : l'adresse du site vient de APP_URL, connue seulement au démarrage.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/messages", "/reservations", "/design", "/api/"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

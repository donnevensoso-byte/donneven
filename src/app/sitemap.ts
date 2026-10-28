import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";
import { CATEGORIES, COMMUNES } from "@/lib/guyane";
import { searchListings } from "@/lib/services/listings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const { items } = await searchListings({ pageSize: 100 });
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/recherche`, changeFrequency: "daily" },
    ...["comment-ca-marche", "faq", "confiance", "cgu", "confidentialite", "mentions-legales"].map((p) => ({ url: `${base}/${p}` })),
    ...CATEGORIES.map((c) => ({ url: `${base}/recherche?categorie=${c.slug}` })),
    ...COMMUNES.map((c) => ({ url: `${base}/recherche?commune=${c.slug}` })),
    ...items.map((l) => ({ url: `${base}/annonces/${l.id}`, lastModified: l.createdAt })),
  ];
}

import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";
import { CATEGORIES, COMMUNES } from "@/lib/guyane";
import { listingCounts, searchListings } from "@/lib/services/listings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const [{ items }, counts] = await Promise.all([searchListings({ pageSize: 100 }), listingCounts()]);
  const has = (filter: (c: { commune: string; category: string }) => boolean) => counts.some(filter);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/recherche`, changeFrequency: "daily" },
    ...["comment-ca-marche", "faq", "confiance", "cgu", "confidentialite", "mentions-legales"].map((p) => ({ url: `${base}/${p}` })),
    { url: `${base}/location-outils`, changeFrequency: "weekly" },
    // Pages locales qui ont au moins une annonce (les autres sont en noindex).
    ...CATEGORIES.filter((c) => has((x) => x.category === c.slug)).map((c) => ({ url: `${base}/location-outils/${c.slug}` })),
    ...COMMUNES.filter((c) => has((x) => x.commune === c.slug)).map((c) => ({ url: `${base}/location-outils/${c.slug}` })),
    ...counts.map((x) => ({ url: `${base}/location-outils/${x.category}/${x.commune}` })),
    ...items.map((l) => ({ url: `${base}/annonces/${l.id}`, lastModified: l.createdAt })),
  ];
}

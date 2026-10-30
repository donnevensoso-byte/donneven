import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, COMMUNE_AREAS, COMMUNES } from "@/lib/guyane";
import { listingCounts } from "@/lib/services/listings";

export const metadata: Metadata = {
  title: "Location d'outils en Guyane, par commune et par catégorie",
  description: "Toutes les communes et catégories de matériel à louer entre particuliers en Guyane.",
  alternates: { canonical: "/location-outils" },
};

export default async function LocalIndexPage() {
  const counts = await listingCounts();
  const byCommune = (slug: string) => counts.filter((c) => c.commune === slug).reduce((n, c) => n + c.count, 0);
  const byCategory = (slug: string) => counts.filter((c) => c.category === slug).reduce((n, c) => n + c.count, 0);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Location d&apos;outils en Guyane</h1>
      <p className="mt-2 max-w-3xl text-muted">Trouvez le matériel près de chez vous, commune par commune, ou par type de matériel.</p>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Par type de matériel</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/location-outils/${c.slug}`} className="chip">
                {c.icon} {c.name} ({byCategory(c.slug)})
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {COMMUNE_AREAS.map((area) => (
        <section key={area} className="mt-8">
          <h2 className="text-lg font-semibold">{area}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {COMMUNES.filter((c) => c.area === area).map((c) => (
              <li key={c.slug}>
                <Link href={`/location-outils/${c.slug}`} className="chip">
                  {c.name} ({byCommune(c.slug)})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

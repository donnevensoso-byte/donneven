import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { EmptyState } from "@/components/ui";
import { CATEGORIES, COMMUNES, type Category, type Commune } from "@/lib/guyane";
import { listingCounts, searchListings } from "@/lib/services/listings";

/** Page locale (commune, catégorie, ou les deux) : vraie liste d'annonces + liens voisins. */
export async function LocalLanding({ commune, category }: { commune?: Commune; category?: Category }) {
  const [{ items, total }, counts] = await Promise.all([
    searchListings({ commune: commune?.slug, category: category?.slug, pageSize: 24 }),
    listingCounts(),
  ]);
  const searchHref = `/recherche?${new URLSearchParams({ ...(category && { categorie: category.slug }), ...(commune && { commune: commune.slug }) })}`;
  const sum = (filter: (c: { commune: string; category: string }) => boolean) =>
    counts.filter(filter).reduce((n, c) => n + c.count, 0);

  // Liens voisins : catégories présentes dans la commune, ou communes où la catégorie est proposée.
  const categoryLinks = commune
    ? CATEGORIES.map((c) => ({ c, n: sum((x) => x.commune === commune.slug && x.category === c.slug) })).filter((x) => x.n > 0 && x.c.slug !== category?.slug)
    : [];
  const communeLinks = COMMUNES.filter((c) => c.slug !== commune?.slug && (!commune || c.area === commune.area))
    .map((c) => ({ c, n: sum((x) => x.commune === c.slug && (!category || x.category === category.slug)) }))
    .filter((x) => x.n > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-muted" aria-label="Fil d'Ariane">
        <Link href="/location-outils" className="hover:underline">Location d&apos;outils en Guyane</Link>
        {category && commune && (
          <>
            {" › "}
            <Link href={`/location-outils/${category.slug}`} className="hover:underline">{category.name}</Link>
          </>
        )}
      </nav>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        {category ? `Location ${category.name.toLowerCase()}` : "Location d'outils"}
        {commune ? ` à ${commune.name}` : " en Guyane"}
      </h1>
      <p className="mt-2 max-w-3xl text-muted">
        {category ? `${category.examples}… ` : "Débroussailleuse, nettoyeur haute pression, groupe électrogène, kayak… "}
        Louez entre voisins{commune ? ` à ${commune.name} et autour (${commune.area})` : ", de Saint-Laurent à Saint-Georges"} : vous
        posez votre question au propriétaire gratuitement, vous réglez en main propre ou par carte, et l&apos;état des lieux se fait en photos.
      </p>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">
          {total} annonce{total > 1 ? "s" : ""} en ligne
        </p>
        {total > items.length && (
          <Link href={searchHref} className="btn-secondary">
            Voir les {total} annonces
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState icon="🧰" title="Pas encore d'annonce ici" action={{ href: "/annonces/nouvelle", label: "Proposer un outil" }}>
          Soyez le premier à proposer {category ? "ce type de matériel" : "du matériel"}
          {commune ? ` à ${commune.name}` : ""} : la publication est gratuite.
        </EmptyState>
      ) : (
        <ListingGrid listings={items} />
      )}

      {(categoryLinks.length > 0 || communeLinks.length > 0) && (
        <section className="mt-12 grid gap-8 sm:grid-cols-2">
          {categoryLinks.length > 0 && commune && (
            <div>
              <h2 className="text-lg font-semibold">Autre matériel à {commune.name}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {categoryLinks.map(({ c, n }) => (
                  <li key={c.slug}>
                    <Link href={`/location-outils/${c.slug}/${commune.slug}`} className="chip">
                      {c.icon} {c.name} ({n})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {communeLinks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">{commune ? `Près de ${commune.name}` : "Par commune"}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {communeLinks.map(({ c, n }) => (
                  <li key={c.slug}>
                    <Link href={category ? `/location-outils/${category.slug}/${c.slug}` : `/location-outils/${c.slug}`} className="chip">
                      {c.name} ({n})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

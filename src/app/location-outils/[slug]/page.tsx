import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalLanding } from "@/components/local-landing";
import { getCategory, getCommune } from "@/lib/guyane";
import { searchListings } from "@/lib/services/listings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const commune = getCommune(slug);
  const category = commune ? undefined : getCategory(slug);
  if (!commune && !category) return {};
  const { total } = await searchListings({ commune: commune?.slug, category: category?.slug, pageSize: 1 });
  const title = commune ? `Location d'outils à ${commune.name}` : `Location ${category!.name.toLowerCase()} en Guyane`;
  return {
    title,
    description: `${total} annonce${total > 1 ? "s" : ""} entre particuliers. ${category?.examples ?? "Outillage, jardin, nettoyage, énergie, fleuve"}… Question gratuite au propriétaire.`,
    alternates: { canonical: `/location-outils/${slug}` },
    robots: total > 0 ? undefined : { index: false },
  };
}

export default async function LocalPage({ params }: Props) {
  const { slug } = await params;
  const commune = getCommune(slug);
  const category = commune ? undefined : getCategory(slug);
  if (!commune && !category) notFound();
  return <LocalLanding commune={commune} category={category} />;
}

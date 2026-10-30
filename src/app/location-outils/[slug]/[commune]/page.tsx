import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalLanding } from "@/components/local-landing";
import { getCategory, getCommune } from "@/lib/guyane";
import { searchListings } from "@/lib/services/listings";

type Props = { params: Promise<{ slug: string; commune: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, commune: communeSlug } = await params;
  const category = getCategory(slug);
  const commune = getCommune(communeSlug);
  if (!category || !commune) return {};
  const { total } = await searchListings({ commune: commune.slug, category: category.slug, pageSize: 1 });
  return {
    title: `Location ${category.name.toLowerCase()} à ${commune.name}`,
    description: `${total} annonce${total > 1 ? "s" : ""} entre voisins à ${commune.name}. ${category.examples}…`,
    alternates: { canonical: `/location-outils/${category.slug}/${commune.slug}` },
    robots: total > 0 ? undefined : { index: false },
  };
}

export default async function CategoryInCommunePage({ params }: Props) {
  const { slug, commune: communeSlug } = await params;
  const category = getCategory(slug);
  const commune = getCommune(communeSlug);
  if (!category || !commune) notFound();
  return <LocalLanding commune={commune} category={category} />;
}

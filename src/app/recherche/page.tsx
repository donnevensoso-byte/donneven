import type { Metadata } from "next";
import Link from "next/link";
import { CommuneOptions } from "@/components/commune-select";
import { ListingGrid } from "@/components/listing-card";
import { ListingsMap } from "@/components/map";
import { EmptyState } from "@/components/ui";
import { isIsoDate, todayInGuyane } from "@/lib/dates";
import { CATEGORIES, communeName, getCategory, getCommune } from "@/lib/guyane";
import { parseEuros } from "@/lib/money";
import { searchListings, type SearchFilters } from "@/lib/services/listings";

type Params = {
  q?: string;
  categorie?: string;
  commune?: string;
  rayon?: string;
  prixmax?: string;
  du?: string;
  au?: string;
  tri?: string;
  livraison?: string;
  vue?: string;
  page?: string;
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const p = await searchParams;
  const what = getCategory(p.categorie)?.name ?? (p.q ? `« ${p.q} »` : "Matériel");
  const where = p.commune ? communeName(p.commune) : "Guyane";
  return { title: `${what} à louer – ${where}` };
}

const RADII = [5, 10, 20, 50];

const SORTS = [
  { value: "recommended", label: "Recommandées" },
  { value: "recent", label: "Plus récentes" },
  { value: "distance", label: "Plus proches" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const view = p.vue === "carte" ? "carte" : "liste";
  const page = Math.max(1, Number(p.page) || 1);
  const sort = SORTS.some((s) => s.value === p.tri) ? (p.tri as SearchFilters["sort"]) : "recommended";
  const filters: SearchFilters = {
    q: p.q?.slice(0, 100),
    category: getCategory(p.categorie)?.slug,
    commune: getCommune(p.commune)?.slug,
    radiusKm: RADII.includes(Number(p.rayon)) ? Number(p.rayon) : undefined,
    maxPrice: parseEuros(p.prixmax) ?? undefined,
    start: p.du && isIsoDate(p.du) ? p.du : undefined,
    end: p.au && isIsoDate(p.au) ? p.au : p.du && isIsoDate(p.du) ? p.du : undefined,
    delivery: p.livraison === "1",
    sort,
    page: view === "carte" ? 1 : page,
    pageSize: view === "carte" ? 200 : 24,
  };
  const { items, total } = await searchListings(filters);
  const pages = Math.ceil(total / 24);
  const today = todayInGuyane();

  const urlWith = (changes: Partial<Params>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...p, ...changes })) if (v) params.set(k, String(v));
    const qs = params.toString();
    return `/recherche${qs ? `?${qs}` : ""}`;
  };
  const activeFilters = [p.categorie, p.commune, p.rayon, p.prixmax, p.du, p.livraison].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <form action="/recherche" className="space-y-3" role="search">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="q">Rechercher</label>
          <input id="q" name="q" type="search" defaultValue={p.q} placeholder="Quel outil cherchez-vous ?" className="input flex-1" />
          <button type="submit" className="btn-primary">Rechercher</button>
        </div>
        <details className="card group p-4 md:open:pb-4" open={activeFilters > 0 ? true : undefined}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            <span>⚙️ Filtres{activeFilters > 0 ? ` (${activeFilters})` : ""}</span>
            <span className="text-muted group-open:rotate-180" aria-hidden>▾</span>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label" htmlFor="categorie">Catégorie</label>
              <select className="input" id="categorie" name="categorie" defaultValue={p.categorie ?? ""}>
                <option value="">Toutes</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="commune">Commune</label>
              <select className="input" id="commune" name="commune" defaultValue={p.commune ?? ""}>
                <option value="">Toute la Guyane</option>
                <CommuneOptions />
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rayon">Autour de la commune</label>
              <select className="input" id="rayon" name="rayon" defaultValue={p.rayon ?? ""}>
                <option value="">Cette commune seulement</option>
                {RADII.map((r) => (
                  <option key={r} value={r}>{r} km autour</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="du">Disponible du</label>
              <input className="input" type="date" id="du" name="du" min={today} defaultValue={p.du} />
            </div>
            <div>
              <label className="label" htmlFor="au">au</label>
              <input className="input" type="date" id="au" name="au" min={today} defaultValue={p.au} />
            </div>
            <div>
              <label className="label" htmlFor="prixmax">Prix max / jour (€)</label>
              <input className="input" id="prixmax" name="prixmax" inputMode="decimal" defaultValue={p.prixmax} placeholder="50" />
            </div>
            <div>
              <label className="label" htmlFor="tri">Trier par</label>
              <select className="input" id="tri" name="tri" defaultValue={sort}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 self-end pb-3 text-sm">
              <input type="checkbox" name="livraison" value="1" defaultChecked={p.livraison === "1"} className="size-4 accent-brand-600" />
              Livraison possible
            </label>
            <input type="hidden" name="vue" value={view === "carte" ? "carte" : ""} />
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary flex-1">Appliquer</button>
              {activeFilters > 0 && <Link href={p.q ? `/recherche?q=${encodeURIComponent(p.q)}` : "/recherche"} className="btn-ghost">Effacer</Link>}
            </div>
          </div>
        </details>
      </form>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          {total} annonce{total > 1 ? "s" : ""}
          {filters.category ? ` · ${getCategory(filters.category)?.name}` : ""}
          {filters.commune ? ` · ${communeName(filters.commune)}` : ""}
        </h1>
        <div className="inline-flex rounded-xl border border-line bg-white p-1 text-sm font-medium" role="group" aria-label="Affichage">
          <Link href={urlWith({ vue: undefined, page: undefined })} aria-current={view === "liste" ? "page" : undefined} className={`rounded-lg px-3 py-1.5 ${view === "liste" ? "bg-brand-600 text-white" : "text-muted"}`}>
            Liste
          </Link>
          <Link href={urlWith({ vue: "carte", page: undefined })} aria-current={view === "carte" ? "page" : undefined} className={`rounded-lg px-3 py-1.5 ${view === "carte" ? "bg-brand-600 text-white" : "text-muted"}`}>
            Carte
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🔎" title="Aucune annonce ne correspond" action={{ href: "/annonces/nouvelle", label: "Proposer ce matériel" }}>
          Essayez d&apos;élargir la recherche à toute la Guyane ou à d&apos;autres dates. Vous avez ce matériel ? Proposez-le !
        </EmptyState>
      ) : view === "carte" ? (
        <div className="h-[65vh] overflow-hidden rounded-card border border-line">
          <ListingsMap listings={items.map((l) => ({ id: l.id, title: l.title, lat: l.lat, lng: l.lng, dayPrice: l.dayPrice }))} />
        </div>
      ) : (
        <>
          <ListingGrid listings={items} />
          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && <Link href={urlWith({ page: String(page - 1) })} className="btn-secondary">← Précédent</Link>}
              <span className="px-3 text-sm text-muted">Page {page} / {pages}</span>
              {page < pages && <Link href={urlWith({ page: String(page + 1) })} className="btn-secondary">Suivant →</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

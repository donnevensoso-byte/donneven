import { CATEGORY_IDS } from "./constants";
import { zonedDate } from "./dates";
import { findCommune, isTerritoryId } from "./territories";
import type { SearchFilters } from "./queries";

export type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseSearchParams(p: RawParams): SearchFilters & { raw: Record<string, string> } {
  const territory = isTerritoryId(one(p.territoire)) ? one(p.territoire) : "guadeloupe";
  // « lieu » vient du formulaire de recherche : c:<commune> ou h:<AEROPORT|PORT>
  const lieu = one(p.lieu);
  const communeParam = lieu.startsWith("c:") ? lieu.slice(2) : one(p.commune);
  const deliveryParam = lieu.startsWith("h:") ? lieu.slice(2) : one(p.livraison);
  const commune = findCommune(territory, communeParam)?.name;
  const start = one(p.debut);
  const end = one(p.fin);
  const startAt = start ? zonedDate(territory, start, one(p.hdebut) || "10:00") : null;
  const endAt = end ? zonedDate(territory, end, one(p.hfin) || "10:00") : null;
  const category = CATEGORY_IDS.includes(one(p.categorie) as never) ? one(p.categorie) : undefined;
  const transmission = ["MANUELLE", "AUTOMATIQUE"].includes(one(p.boite)) ? one(p.boite) : undefined;
  const maxPrice = Number(one(p.prixMax)) > 0 ? Math.round(Number(one(p.prixMax)) * 100) : undefined;
  const delivery = deliveryParam === "AEROPORT" || deliveryParam === "PORT" ? deliveryParam : undefined;
  const sort = ["prix", "note", "distance"].includes(one(p.tri)) ? (one(p.tri) as SearchFilters["sort"]) : "pertinence";
  const seats = Number(one(p.places)) > 0 ? Number(one(p.places)) : undefined;

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (one(v)) raw[k] = one(v);

  return {
    territory,
    commune,
    startAt: startAt && endAt && endAt > startAt ? startAt : null,
    endAt: startAt && endAt && endAt > startAt ? endAt : null,
    category,
    transmission,
    maxPrice,
    delivery,
    instant: one(p.instant) === "1",
    track: one(p.piste) === "1",
    ferry: one(p.ferry) === "1",
    seats,
    sort,
    raw,
  };
}

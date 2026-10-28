// Données de référence propres à la Guyane : communes et catégories de matériel.

export type Commune = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** Bassin de vie, utilisé pour regrouper les communes dans les listes. */
  area: "Île de Cayenne" | "Savanes" | "Ouest" | "Fleuve" | "Est" | "Intérieur";
};

export const COMMUNES: Commune[] = [
  { slug: "cayenne", name: "Cayenne", lat: 4.9372, lng: -52.326, area: "Île de Cayenne" },
  { slug: "remire-montjoly", name: "Rémire-Montjoly", lat: 4.9167, lng: -52.2667, area: "Île de Cayenne" },
  { slug: "matoury", name: "Matoury", lat: 4.8475, lng: -52.3311, area: "Île de Cayenne" },
  { slug: "macouria", name: "Macouria", lat: 4.9819, lng: -52.4716, area: "Savanes" },
  { slug: "montsinery-tonnegrande", name: "Montsinéry-Tonnegrande", lat: 4.8933, lng: -52.4889, area: "Savanes" },
  { slug: "roura", name: "Roura", lat: 4.7286, lng: -52.3264, area: "Savanes" },
  { slug: "kourou", name: "Kourou", lat: 5.16, lng: -52.65, area: "Savanes" },
  { slug: "sinnamary", name: "Sinnamary", lat: 5.375, lng: -52.9567, area: "Savanes" },
  { slug: "iracoubo", name: "Iracoubo", lat: 5.4806, lng: -53.2025, area: "Savanes" },
  { slug: "saint-laurent-du-maroni", name: "Saint-Laurent-du-Maroni", lat: 5.4982, lng: -54.0325, area: "Ouest" },
  { slug: "mana", name: "Mana", lat: 5.6597, lng: -53.7775, area: "Ouest" },
  { slug: "awala-yalimapo", name: "Awala-Yalimapo", lat: 5.7425, lng: -53.9311, area: "Ouest" },
  { slug: "apatou", name: "Apatou", lat: 5.1553, lng: -54.3439, area: "Fleuve" },
  { slug: "grand-santi", name: "Grand-Santi", lat: 4.2539, lng: -54.3811, area: "Fleuve" },
  { slug: "papaichton", name: "Papaïchton", lat: 3.8006, lng: -54.15, area: "Fleuve" },
  { slug: "maripasoula", name: "Maripasoula", lat: 3.6408, lng: -54.0281, area: "Fleuve" },
  { slug: "saint-georges", name: "Saint-Georges", lat: 3.8906, lng: -51.8039, area: "Est" },
  { slug: "regina", name: "Régina", lat: 4.3133, lng: -52.1333, area: "Est" },
  { slug: "ouanary", name: "Ouanary", lat: 4.2131, lng: -51.6697, area: "Est" },
  { slug: "camopi", name: "Camopi", lat: 3.1661, lng: -52.3381, area: "Est" },
  { slug: "saul", name: "Saül", lat: 3.6225, lng: -53.2097, area: "Intérieur" },
  { slug: "saint-elie", name: "Saint-Élie", lat: 4.8228, lng: -53.2783, area: "Intérieur" },
];

export const COMMUNE_AREAS = ["Île de Cayenne", "Savanes", "Ouest", "Fleuve", "Est", "Intérieur"] as const;

const communeBySlug = new Map(COMMUNES.map((c) => [c.slug, c]));

export function getCommune(slug: string | null | undefined): Commune | undefined {
  return slug ? communeBySlug.get(slug) : undefined;
}

export function communeName(slug: string | null | undefined): string {
  return getCommune(slug)?.name ?? "Guyane";
}

/** Centre de la carte et emprise pour toute la Guyane. */
export const GUYANE_CENTER = { lat: 4.4, lng: -53.1 };
export const GUYANE_BOUNDS = { minLat: 2.1, maxLat: 5.9, minLng: -54.7, maxLng: -51.5 };

export function isInGuyane(lat: number, lng: number): boolean {
  return (
    lat >= GUYANE_BOUNDS.minLat &&
    lat <= GUYANE_BOUNDS.maxLat &&
    lng >= GUYANE_BOUNDS.minLng &&
    lng <= GUYANE_BOUNDS.maxLng
  );
}

export type Category = {
  slug: string;
  name: string;
  icon: string;
  examples: string;
};

export const CATEGORIES: Category[] = [
  { slug: "bricolage", name: "Bricolage", icon: "🔧", examples: "Perceuse, perforateur, visseuse, scie sauteuse, ponceuse" },
  { slug: "jardin", name: "Jardin & débroussaillage", icon: "🌿", examples: "Débroussailleuse, tronçonneuse, tondeuse, taille-haie, sabre" },
  { slug: "nettoyage", name: "Nettoyage", icon: "🧽", examples: "Nettoyeur haute pression, aspirateur eau et poussière, shampouineuse" },
  { slug: "construction", name: "Construction & BTP", icon: "🧱", examples: "Bétonnière, marteau-piqueur, échafaudage, disqueuse, compacteur" },
  { slug: "peinture", name: "Peinture & finitions", icon: "🎨", examples: "Pistolet à peinture, décolleuse, escabeau, ponceuse à placo" },
  { slug: "energie", name: "Électricité & énergie", icon: "⚡", examples: "Groupe électrogène, rallonges, projecteurs de chantier" },
  { slug: "eau", name: "Pompes & plomberie", icon: "💧", examples: "Pompe vide-cave, motopompe, cuve, déboucheur" },
  { slug: "demenagement", name: "Déménagement & transport", icon: "📦", examples: "Remorque, diable, sangles, couvertures de protection" },
  { slug: "auto", name: "Auto & moto", icon: "🚗", examples: "Cric, chandelles, booster de batterie, compresseur" },
  { slug: "fete", name: "Fête & réception", icon: "🎉", examples: "Barnum, tables, chaises, sono, éclairage, glacière géante" },
  { slug: "fleuve", name: "Fleuve & nautisme", icon: "🛶", examples: "Kayak, moteur hors-bord, gilets de sauvetage, matériel de pêche" },
  { slug: "carbet", name: "Carbet & camping", icon: "🏕️", examples: "Hamacs, moustiquaires, bâches, réchaud, lampes frontales" },
  { slug: "autre", name: "Autre", icon: "🧰", examples: "Tout le reste" },
];

const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string | null | undefined): Category | undefined {
  return slug ? categoryBySlug.get(slug) : undefined;
}

export const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "tres_bon", label: "Très bon état" },
  { value: "bon", label: "Bon état" },
  { value: "correct", label: "État correct" },
] as const;

export type Condition = (typeof CONDITIONS)[number]["value"];

export function conditionLabel(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

/** Fuseau horaire de la Guyane (UTC−3, sans heure d'été). */
export const TIMEZONE = "America/Cayenne";

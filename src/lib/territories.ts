// Données géographiques des territoires couverts par Woulé.
// Coordonnées approximatives des bourgs : elles servent à positionner les
// véhicules sur la carte (position floutée) et à centrer la recherche.

export type Commune = {
  name: string;
  lat: number;
  lng: number;
  /** false pour les communes de l'intérieur guyanais non reliées par la route */
  roadAccess?: boolean;
  /** île ou dépendance (Marie-Galante, Les Saintes…) */
  island?: string;
};

export type Hub = {
  id: string;
  name: string;
  kind: "AEROPORT" | "PORT";
  lat: number;
  lng: number;
};

export type Territory = {
  id: TerritoryId;
  name: string;
  shortName: string;
  code: string;
  timeZone: string;
  /** décalage UTC fixe (pas d'heure d'été dans ces territoires) */
  utcOffset: string;
  phonePrefix: string;
  center: [number, number];
  zoom: number;
  tagline: string;
  communes: Commune[];
  hubs: Hub[];
  /** dépendances accessibles en ferry avec un véhicule */
  ferryDestinations: string[];
  tips: string[];
};

export type TerritoryId =
  | "guadeloupe"
  | "martinique"
  | "guyane"
  | "saint-martin"
  | "saint-barthelemy";

export const TERRITORIES: Territory[] = [
  {
    id: "guadeloupe",
    name: "Guadeloupe",
    shortName: "Gwada",
    code: "971",
    timeZone: "America/Guadeloupe",
    utcOffset: "-04:00",
    phonePrefix: "+590",
    center: [16.18, -61.55],
    zoom: 10,
    tagline: "De la Grande-Terre à la Basse-Terre, et jusqu'à Marie-Galante",
    communes: [
      { name: "Les Abymes", lat: 16.271, lng: -61.504 },
      { name: "Anse-Bertrand", lat: 16.472, lng: -61.507 },
      { name: "Baie-Mahault", lat: 16.267, lng: -61.586 },
      { name: "Baillif", lat: 16.02, lng: -61.746 },
      { name: "Basse-Terre", lat: 15.997, lng: -61.726 },
      { name: "Bouillante", lat: 16.131, lng: -61.766 },
      { name: "Capesterre-Belle-Eau", lat: 16.044, lng: -61.565 },
      { name: "Capesterre-de-Marie-Galante", lat: 15.896, lng: -61.226, island: "Marie-Galante" },
      { name: "Deshaies", lat: 16.306, lng: -61.794 },
      { name: "Gourbeyre", lat: 15.993, lng: -61.692 },
      { name: "Goyave", lat: 16.135, lng: -61.574 },
      { name: "Grand-Bourg", lat: 15.884, lng: -61.314, island: "Marie-Galante" },
      { name: "La Désirade", lat: 16.31, lng: -61.075, island: "La Désirade" },
      { name: "Lamentin", lat: 16.27, lng: -61.632 },
      { name: "Le Gosier", lat: 16.206, lng: -61.493 },
      { name: "Le Moule", lat: 16.333, lng: -61.344 },
      { name: "Morne-à-l'Eau", lat: 16.333, lng: -61.456 },
      { name: "Petit-Bourg", lat: 16.191, lng: -61.591 },
      { name: "Petit-Canal", lat: 16.38, lng: -61.487 },
      { name: "Pointe-à-Pitre", lat: 16.241, lng: -61.533 },
      { name: "Pointe-Noire", lat: 16.232, lng: -61.789 },
      { name: "Port-Louis", lat: 16.418, lng: -61.532 },
      { name: "Saint-Claude", lat: 16.023, lng: -61.701 },
      { name: "Saint-François", lat: 16.252, lng: -61.274 },
      { name: "Saint-Louis", lat: 15.957, lng: -61.316, island: "Marie-Galante" },
      { name: "Sainte-Anne", lat: 16.226, lng: -61.385 },
      { name: "Sainte-Rose", lat: 16.332, lng: -61.698 },
      { name: "Terre-de-Bas", lat: 15.854, lng: -61.636, island: "Les Saintes" },
      { name: "Terre-de-Haut", lat: 15.866, lng: -61.585, island: "Les Saintes" },
      { name: "Trois-Rivières", lat: 15.976, lng: -61.645 },
      { name: "Vieux-Fort", lat: 15.951, lng: -61.705 },
      { name: "Vieux-Habitants", lat: 16.059, lng: -61.765 },
    ],
    hubs: [
      { id: "ptp-aeroport", name: "Aéroport Guadeloupe – Pôle Caraïbes", kind: "AEROPORT", lat: 16.265, lng: -61.527 },
      { id: "ptp-bergevin", name: "Gare maritime de Bergevin (Pointe-à-Pitre)", kind: "PORT", lat: 16.236, lng: -61.538 },
      { id: "trois-rivieres-port", name: "Gare maritime de Trois-Rivières", kind: "PORT", lat: 15.97, lng: -61.645 },
    ],
    ferryDestinations: ["Marie-Galante", "Les Saintes", "La Désirade"],
    tips: [
      "Prévoyez un véhicule avec un bon moteur pour la route de la Traversée et la montée vers la Soufrière.",
      "Les embouteillages autour de Pointe-à-Pitre et Baie-Mahault sont fréquents de 6 h 30 à 8 h 30.",
      "Pour Marie-Galante, vérifiez que le propriétaire autorise le passage en ferry.",
    ],
  },
  {
    id: "martinique",
    name: "Martinique",
    shortName: "Madinina",
    code: "972",
    timeZone: "America/Martinique",
    utcOffset: "-04:00",
    phonePrefix: "+596",
    center: [14.65, -61.02],
    zoom: 10,
    tagline: "Du Nord Caraïbe aux plages du Sud, l'île aux fleurs à votre rythme",
    communes: [
      { name: "L'Ajoupa-Bouillon", lat: 14.817, lng: -61.14 },
      { name: "Les Anses-d'Arlet", lat: 14.488, lng: -61.08 },
      { name: "Basse-Pointe", lat: 14.871, lng: -61.116 },
      { name: "Bellefontaine", lat: 14.669, lng: -61.161 },
      { name: "Le Carbet", lat: 14.708, lng: -61.179 },
      { name: "Case-Pilote", lat: 14.64, lng: -61.138 },
      { name: "Le Diamant", lat: 14.478, lng: -61.031 },
      { name: "Ducos", lat: 14.574, lng: -60.975 },
      { name: "Fonds-Saint-Denis", lat: 14.731, lng: -61.12 },
      { name: "Fort-de-France", lat: 14.607, lng: -61.067 },
      { name: "Le François", lat: 14.615, lng: -60.903 },
      { name: "Grand'Rivière", lat: 14.872, lng: -61.178 },
      { name: "Gros-Morne", lat: 14.716, lng: -61.0 },
      { name: "Le Lamentin", lat: 14.613, lng: -60.999 },
      { name: "Le Lorrain", lat: 14.832, lng: -61.062 },
      { name: "Macouba", lat: 14.874, lng: -61.143 },
      { name: "Le Marigot", lat: 14.809, lng: -61.03 },
      { name: "Le Marin", lat: 14.468, lng: -60.869 },
      { name: "Le Morne-Rouge", lat: 14.769, lng: -61.133 },
      { name: "Le Morne-Vert", lat: 14.706, lng: -61.141 },
      { name: "Le Prêcheur", lat: 14.8, lng: -61.223 },
      { name: "Rivière-Pilote", lat: 14.484, lng: -60.9 },
      { name: "Rivière-Salée", lat: 14.53, lng: -60.969 },
      { name: "Le Robert", lat: 14.678, lng: -60.94 },
      { name: "Saint-Esprit", lat: 14.559, lng: -60.932 },
      { name: "Saint-Joseph", lat: 14.669, lng: -61.04 },
      { name: "Saint-Pierre", lat: 14.743, lng: -61.176 },
      { name: "Sainte-Anne", lat: 14.44, lng: -60.884 },
      { name: "Sainte-Luce", lat: 14.469, lng: -60.924 },
      { name: "Sainte-Marie", lat: 14.784, lng: -60.993 },
      { name: "Schœlcher", lat: 14.615, lng: -61.089 },
      { name: "La Trinité", lat: 14.738, lng: -60.965 },
      { name: "Les Trois-Îlets", lat: 14.54, lng: -61.039 },
      { name: "Le Vauclin", lat: 14.546, lng: -60.838 },
    ],
    hubs: [
      { id: "fdf-aeroport", name: "Aéroport Martinique Aimé Césaire", kind: "AEROPORT", lat: 14.591, lng: -61.0 },
      { id: "fdf-interiles", name: "Terminal inter-îles de Fort-de-France", kind: "PORT", lat: 14.601, lng: -61.07 },
    ],
    ferryDestinations: [],
    tips: [
      "La route de la Trace (N3) est magnifique mais sinueuse : préférez un véhicule récent.",
      "Le Lamentin et l'accès à Fort-de-France sont très chargés aux heures de pointe.",
      "Pensez à la navette maritime Fort-de-France – Trois-Îlets pour éviter les bouchons.",
    ],
  },
  {
    id: "guyane",
    name: "Guyane",
    shortName: "Lagwiyann",
    code: "973",
    timeZone: "America/Cayenne",
    utcOffset: "-03:00",
    phonePrefix: "+594",
    center: [5.05, -52.75],
    zoom: 8,
    tagline: "De Cayenne à Saint-Laurent-du-Maroni, la route du littoral et l'Amazonie",
    communes: [
      { name: "Apatou", lat: 5.155, lng: -54.343 },
      { name: "Awala-Yalimapo", lat: 5.743, lng: -53.93 },
      { name: "Camopi", lat: 3.164, lng: -52.333, roadAccess: false },
      { name: "Cayenne", lat: 4.933, lng: -52.33 },
      { name: "Grand-Santi", lat: 4.257, lng: -54.38, roadAccess: false },
      { name: "Iracoubo", lat: 5.481, lng: -53.205 },
      { name: "Kourou", lat: 5.16, lng: -52.65 },
      { name: "Macouria", lat: 4.98, lng: -52.47 },
      { name: "Mana", lat: 5.66, lng: -53.778 },
      { name: "Maripasoula", lat: 3.64, lng: -54.03, roadAccess: false },
      { name: "Matoury", lat: 4.848, lng: -52.329 },
      { name: "Montsinéry-Tonnegrande", lat: 4.894, lng: -52.495 },
      { name: "Ouanary", lat: 4.214, lng: -51.666, roadAccess: false },
      { name: "Papaïchton", lat: 3.8, lng: -54.15, roadAccess: false },
      { name: "Régina", lat: 4.317, lng: -52.133 },
      { name: "Rémire-Montjoly", lat: 4.917, lng: -52.276 },
      { name: "Roura", lat: 4.728, lng: -52.326 },
      { name: "Saint-Élie", lat: 4.823, lng: -53.288, roadAccess: false },
      { name: "Saint-Georges", lat: 3.893, lng: -51.805 },
      { name: "Saint-Laurent-du-Maroni", lat: 5.498, lng: -54.032 },
      { name: "Saül", lat: 3.622, lng: -53.207, roadAccess: false },
      { name: "Sinnamary", lat: 5.377, lng: -52.957 },
    ],
    hubs: [
      { id: "cay-aeroport", name: "Aéroport Cayenne – Félix Éboué", kind: "AEROPORT", lat: 4.82, lng: -52.36 },
      { id: "cay-degrad", name: "Port du Larivot / Dégrad des Cannes", kind: "PORT", lat: 4.856, lng: -52.272 },
    ],
    ferryDestinations: [],
    tips: [
      "Saint-Laurent-du-Maroni est à environ 3 h de route de Cayenne : prévoyez le kilométrage.",
      "Les pistes (latérite) nécessitent souvent un 4x4 et l'accord explicite du propriétaire.",
      "Des contrôles de gendarmerie ont lieu aux barrages d'Iracoubo et de Bélizon : ayez vos papiers.",
      "Faites le plein avant de quitter les grandes communes, les stations sont rares sur la RN1 et la RN2.",
    ],
  },
  {
    id: "saint-martin",
    name: "Saint-Martin",
    shortName: "SXM",
    code: "978",
    timeZone: "America/Marigot",
    utcOffset: "-04:00",
    phonePrefix: "+590",
    center: [18.075, -63.06],
    zoom: 12,
    tagline: "Partie française de la Friendly Island, de Marigot à la Baie Orientale",
    communes: [
      { name: "Marigot", lat: 18.067, lng: -63.083 },
      { name: "Grand-Case", lat: 18.101, lng: -63.054 },
      { name: "Quartier d'Orléans", lat: 18.058, lng: -63.02 },
      { name: "Sandy Ground", lat: 18.071, lng: -63.093 },
      { name: "Baie Nettlé", lat: 18.068, lng: -63.103 },
      { name: "Cul-de-Sac", lat: 18.093, lng: -63.03 },
      { name: "Baie Orientale", lat: 18.087, lng: -63.017 },
    ],
    hubs: [
      { id: "sfg-aeroport", name: "Aéroport de Grand-Case Espérance", kind: "AEROPORT", lat: 18.1, lng: -63.047 },
      { id: "sxm-juliana", name: "Aéroport Princess Juliana (côté hollandais)", kind: "AEROPORT", lat: 18.041, lng: -63.109 },
      { id: "marigot-port", name: "Gare maritime de Marigot", kind: "PORT", lat: 18.069, lng: -63.087 },
    ],
    ferryDestinations: [],
    tips: [
      "Vous pouvez circuler librement côté hollandais (Sint Maarten) sans formalité.",
      "Le pont de Sandy Ground et le rond-point de Bellevue sont souvent saturés en fin de journée.",
    ],
  },
  {
    id: "saint-barthelemy",
    name: "Saint-Barthélemy",
    shortName: "St-Barth",
    code: "977",
    timeZone: "America/St_Barthelemy",
    utcOffset: "-04:00",
    phonePrefix: "+590",
    center: [17.9, -62.83],
    zoom: 13,
    tagline: "Petites routes et grandes pentes : idéal en mini 4x4 ou en scooter",
    communes: [
      { name: "Gustavia", lat: 17.896, lng: -62.85 },
      { name: "Saint-Jean", lat: 17.903, lng: -62.832 },
      { name: "Lorient", lat: 17.905, lng: -62.819 },
      { name: "Flamands", lat: 17.917, lng: -62.859 },
      { name: "Colombier", lat: 17.915, lng: -62.874 },
      { name: "Grand Cul-de-Sac", lat: 17.91, lng: -62.795 },
    ],
    hubs: [
      { id: "sbh-aeroport", name: "Aéroport Rémy de Haenen", kind: "AEROPORT", lat: 17.904, lng: -62.844 },
      { id: "gustavia-port", name: "Port de Gustavia", kind: "PORT", lat: 17.897, lng: -62.851 },
    ],
    ferryDestinations: [],
    tips: [
      "Les routes sont étroites et très pentues : une boîte automatique est vivement conseillée.",
      "Le stationnement à Gustavia est limité, privilégiez un petit gabarit.",
    ],
  },
];

export const TERRITORY_IDS = TERRITORIES.map((t) => t.id) as TerritoryId[];

export function getTerritory(id: string | null | undefined): Territory {
  return TERRITORIES.find((t) => t.id === id) ?? TERRITORIES[0];
}

export function isTerritoryId(id: unknown): id is TerritoryId {
  return typeof id === "string" && TERRITORY_IDS.includes(id as TerritoryId);
}

export function findCommune(territoryId: string, name: string): Commune | undefined {
  return getTerritory(territoryId).communes.find((c) => c.name === name);
}

export function findHub(territoryId: string, kind: Hub["kind"]): Hub | undefined {
  return getTerritory(territoryId).hubs.find((h) => h.kind === kind);
}

/** Décale légèrement une position pour ne pas exposer l'adresse exacte du propriétaire. */
export function blurPosition(lat: number, lng: number, seed: string): [number, number] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const a = ((h & 0xffff) / 0xffff - 0.5) * 0.008;
  const b = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 0.008;
  return [lat + a, lng + b];
}

/** Distance en km entre deux points (formule de haversine). */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const APP_NAME = "Woulé";
export const APP_TAGLINE = "La location de véhicules entre particuliers aux Antilles-Guyane";

export const CATEGORIES = {
  CITADINE: { label: "Citadine", insuranceFactor: 1 },
  BERLINE: { label: "Berline", insuranceFactor: 1.1 },
  SUV: { label: "SUV", insuranceFactor: 1.2 },
  QUATRE_QUATRE: { label: "4x4 / Pick-up", insuranceFactor: 1.3 },
  MONOSPACE: { label: "Monospace / 7 places", insuranceFactor: 1.2 },
  UTILITAIRE: { label: "Utilitaire", insuranceFactor: 1.25 },
  CABRIOLET: { label: "Cabriolet / Buggy", insuranceFactor: 1.3 },
  SCOOTER: { label: "Scooter / Moto", insuranceFactor: 0.6 },
} as const;
export type Category = keyof typeof CATEGORIES;
export const CATEGORY_IDS = Object.keys(CATEGORIES) as Category[];

export const TRANSMISSIONS = { MANUELLE: "Manuelle", AUTOMATIQUE: "Automatique" } as const;
export type Transmission = keyof typeof TRANSMISSIONS;

export const FUELS = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
} as const;
export type Fuel = keyof typeof FUELS;

export const FEATURES = [
  "Bluetooth",
  "GPS",
  "Apple CarPlay / Android Auto",
  "Caméra de recul",
  "Siège bébé",
  "Rehausseur",
  "Galerie / porte-surf",
  "Glacière",
  "Parasol & chaises de plage",
  "Attelage",
  "Casque (scooter)",
  "Top-case (scooter)",
  "Vitres teintées",
  "Régulateur de vitesse",
] as const;

export const INSURANCE_PLANS = {
  ESSENTIELLE: {
    label: "Essentielle",
    perDay: 900,
    deductiblePct: 100,
    description: "Responsabilité civile, assistance 24 h/24. Franchise = montant de la caution.",
  },
  CONFORT: {
    label: "Confort",
    perDay: 1500,
    deductiblePct: 50,
    description: "Franchise réduite de moitié, bris de glace et pneus inclus.",
  },
  SERENITE: {
    label: "Sérénité",
    perDay: 2300,
    deductiblePct: 0,
    description: "Zéro franchise, véhicule de remplacement, couverture événements cycloniques.",
  },
} as const;
export type InsurancePlan = keyof typeof INSURANCE_PLANS;

export const PICKUP_OPTIONS = {
  SUR_PLACE: "Chez le propriétaire",
  AEROPORT: "Livraison à l'aéroport",
  PORT: "Livraison au port / gare maritime",
} as const;
export type PickupOption = keyof typeof PICKUP_OPTIONS;

export const BOOKING_STATUSES = {
  PENDING: { label: "En attente du propriétaire", tone: "amber" },
  AWAITING_PAYMENT: { label: "À payer", tone: "blue" },
  CONFIRMED: { label: "Confirmée", tone: "green" },
  IN_PROGRESS: { label: "En cours", tone: "teal" },
  COMPLETED: { label: "Terminée", tone: "slate" },
  CANCELLED: { label: "Annulée", tone: "red" },
  DECLINED: { label: "Refusée", tone: "red" },
} as const;
export type BookingStatus = keyof typeof BOOKING_STATUSES;

/** Statuts qui bloquent le calendrier du véhicule. */
export const BLOCKING_STATUSES: BookingStatus[] = ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"];

export const WEATHER_LEVELS = {
  JAUNE: { label: "Vigilance jaune", severe: false },
  ORANGE: { label: "Vigilance orange", severe: false },
  ROUGE: { label: "Vigilance rouge", severe: true },
  VIOLET: { label: "Vigilance violette (confinement)", severe: true },
  GRIS: { label: "Phase de sauvegarde (vigilance grise)", severe: true },
} as const;
export type WeatherLevel = keyof typeof WEATHER_LEVELS;

/** Règles économiques de la plateforme. */
export const FEES = {
  /** frais de service payés par le locataire, en % du prix de location */
  serviceFeePct: 10,
  serviceFeeMin: 300,
  /** commission prélevée sur le revenu du propriétaire, en % */
  ownerCommissionPct: 20,
  /** supplément jeune conducteur (permis de moins de 3 ans), par jour */
  youngDriverPerDay: 700,
  youngDriverYears: 3,
  /** âge minimum pour louer */
  minAge: 21,
  /** une demande non traitée expire au bout de ce délai (heures) */
  requestExpiryHours: 24,
} as const;

/** Fourchettes de prix journaliers observées localement (en euros), pour guider les propriétaires. */
export const PRICE_HINTS: Record<Category, [number, number]> = {
  CITADINE: [28, 40],
  BERLINE: [38, 55],
  SUV: [45, 70],
  QUATRE_QUATRE: [60, 95],
  MONOSPACE: [55, 80],
  UTILITAIRE: [50, 75],
  CABRIOLET: [60, 110],
  SCOOTER: [18, 35],
};

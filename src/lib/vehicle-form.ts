// Valeurs du formulaire d'annonce (module partagé serveur / client)

export type VehicleFormValues = {
  make: string; model: string; year: number; category: string; transmission: string; fuel: string;
  seats: number; doors: number; airConditioning: boolean; color: string; features: string; description: string; rules: string;
  territory: string; commune: string; address: string; lat: number | null; lng: number | null;
  pricePerDay: number; weeklyDiscountPct: number; monthlyDiscountPct: number; depositAmount: number;
  kmIncludedPerDay: number; extraKmPrice: number; minDays: number; maxDays: number; instantBooking: boolean;
  airportDelivery: boolean; airportFee: number; portDelivery: boolean; portFee: number; ferryAllowed: boolean; trackAllowed: boolean;
};

export const EMPTY_VEHICLE: VehicleFormValues = {
  make: "", model: "", year: new Date().getFullYear() - 3, category: "CITADINE", transmission: "MANUELLE", fuel: "ESSENCE",
  seats: 5, doors: 5, airConditioning: true, color: "#14a394", features: "", description: "", rules: "Non-fumeur. Merci de rendre le véhicule propre (pas de sable sur les sièges 🏖️).",
  territory: "guadeloupe", commune: "", address: "", lat: null, lng: null,
  pricePerDay: 3500, weeklyDiscountPct: 10, monthlyDiscountPct: 25, depositAmount: 80000,
  kmIncludedPerDay: 200, extraKmPrice: 25, minDays: 1, maxDays: 30, instantBooking: false,
  airportDelivery: false, airportFee: 2500, portDelivery: false, portFee: 2000, ferryAllowed: false, trackAllowed: false,
};

/** Convertit un véhicule en base vers les valeurs du formulaire d'édition. */
export function toFormValues(v: VehicleFormValues): VehicleFormValues {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(EMPTY_VEHICLE)) out[k] = (v as Record<string, unknown>)[k];
  return out as VehicleFormValues;
}

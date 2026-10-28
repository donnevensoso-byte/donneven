export type PriceInput = {
  dayPrice: number; // centimes
  weekPrice?: number | null; // centimes, tarif pour 7 jours
  days: number;
  serviceFeePercent?: number; // 0 pour un paiement en main propre
};

export type PriceBreakdown = {
  days: number;
  weeks: number;
  extraDays: number;
  rentalAmount: number;
  serviceFee: number;
  total: number;
  /** Économie réalisée grâce au tarif semaine. */
  discount: number;
};

/**
 * Calcule le prix d'une location. Le tarif semaine s'applique par tranche de
 * 7 jours ; les jours restants sont facturés au tarif journalier, sans jamais
 * dépasser le prix d'une semaine supplémentaire.
 */
export function computePrice({ dayPrice, weekPrice, days, serviceFeePercent = 0 }: PriceInput): PriceBreakdown {
  if (!Number.isInteger(days) || days < 1) throw new Error("La durée doit être d'au moins un jour");
  const fullPrice = dayPrice * days;
  let rentalAmount = fullPrice;
  let weeks = 0;
  let extraDays = days;
  if (weekPrice && weekPrice > 0 && weekPrice < dayPrice * 7 && days >= 7) {
    weeks = Math.floor(days / 7);
    extraDays = days % 7;
    rentalAmount = weeks * weekPrice + Math.min(extraDays * dayPrice, weekPrice);
  }
  const serviceFee = Math.round((rentalAmount * serviceFeePercent) / 100);
  return {
    days,
    weeks,
    extraDays,
    rentalAmount,
    serviceFee,
    total: rentalAmount + serviceFee,
    discount: fullPrice - rentalAmount,
  };
}

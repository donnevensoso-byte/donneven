import type { BookingStatus } from "./constants";

export type CancellationInput = {
  status: BookingStatus;
  paid: boolean;
  total: number;
  serviceFee: number;
  startAt: Date;
  now: Date;
  by: "RENTER" | "OWNER" | "ADMIN";
  /** une vigilance rouge / violette / grise est active sur le territoire */
  severeWeather: boolean;
};

export type CancellationResult = {
  allowed: boolean;
  refund: number;
  policy: string;
};

const HOUR = 3600 * 1000;

/**
 * Politique d'annulation Woulé :
 * - Garantie Cyclone : remboursement intégral si vigilance rouge, violette ou grise.
 * - Propriétaire ou admin : remboursement intégral du locataire.
 * - Locataire, plus de 48 h avant : remboursé hors frais de service.
 * - Locataire, moins de 48 h avant : 50 % du montant hors frais de service.
 * - Une location commencée ne peut plus être annulée.
 */
export function computeCancellation(i: CancellationInput): CancellationResult {
  if (!["PENDING", "AWAITING_PAYMENT", "CONFIRMED"].includes(i.status)) {
    return { allowed: false, refund: 0, policy: "Cette réservation ne peut plus être annulée." };
  }
  if (!i.paid) {
    return { allowed: true, refund: 0, policy: "Aucun paiement n'a encore été effectué : annulation sans frais." };
  }
  if (i.severeWeather) {
    return { allowed: true, refund: i.total, policy: "Garantie Cyclone : remboursement intégral." };
  }
  if (i.by !== "RENTER") {
    return { allowed: true, refund: i.total, policy: "Annulation par le propriétaire : remboursement intégral." };
  }
  const hoursBefore = (i.startAt.getTime() - i.now.getTime()) / HOUR;
  const refundable = i.total - i.serviceFee;
  if (hoursBefore >= 48) {
    return { allowed: true, refund: refundable, policy: "Plus de 48 h avant le départ : remboursement hors frais de service." };
  }
  return {
    allowed: true,
    refund: Math.round(refundable / 2),
    policy: "Moins de 48 h avant le départ : remboursement de 50 % hors frais de service.",
  };
}

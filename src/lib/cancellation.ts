import { addDays, formatDate } from "./dates";

/**
 * Règles d'annulation telles qu'appliquées par cancelBooking : le locataire annule sans frais
 * jusqu'à la veille du début ; le propriétaire peut annuler jusqu'à la remise. Utilisable côté navigateur.
 */
export function cancellationPolicy(startDate: string | null | undefined, online: boolean): string {
  const refund = online ? " : vous êtes remboursé intégralement, frais de service compris" : "";
  const until = startDate ? `jusqu'au ${formatDate(addDays(startDate, -1), { weekday: "long" })} inclus` : "jusqu'à la veille du début";
  return `Annulation gratuite ${until}${refund}. Si le propriétaire annule avant la remise, ${online ? "vous êtes aussi remboursé intégralement" : "vous ne devez rien"}.`;
}

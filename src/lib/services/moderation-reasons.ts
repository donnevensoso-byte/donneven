// Séparé de moderation.ts pour pouvoir être importé côté navigateur.
export const REPORT_REASONS = [
  "Annonce frauduleuse ou arnaque",
  "Matériel dangereux ou interdit",
  "Contenu inapproprié",
  "Comportement abusif",
  "Autre",
] as const;

export const DISPUTE_REASONS = [
  "Matériel endommagé",
  "Matériel non rendu ou rendu en retard",
  "Matériel non conforme à l'annonce",
  "Rendez-vous non honoré",
  "Problème de paiement ou de caution",
  "Autre",
] as const;

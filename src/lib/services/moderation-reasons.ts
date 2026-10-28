// Séparé de moderation.ts pour pouvoir être importé côté navigateur.
export const REPORT_REASONS = [
  "Annonce frauduleuse ou arnaque",
  "Matériel dangereux ou interdit",
  "Contenu inapproprié",
  "Comportement abusif",
  "Autre",
] as const;

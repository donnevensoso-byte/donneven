export const APP_NAME = "Zouti";
export const APP_TAGLINE = "Louez les outils de vos voisins en Guyane";
export const APP_DESCRIPTION =
  "Zouti, c'est la location d'outils et de matériel entre particuliers en Guyane : débroussailleuse, nettoyeur haute pression, groupe électrogène, barnum, kayak… Louez près de chez vous ou gagnez de l'argent avec votre matériel.";
/** Adresse de contact affichée sur le site et destinataire des signalements (à régler en production). */
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL?.trim() || "contact@zouti97.fr";

/** URL publique du site. Tolère une saisie sans protocole (« zouti97.fr ») : https:// est ajouté. */
export function appUrl(): string {
  const raw = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
  if (!raw) return "http://localhost:3000";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function emailEnabled(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

/** La vérification d'e-mail n'est exigée que si l'envoi d'e-mails est configuré. */
export function requireEmailVerification(): boolean {
  return emailEnabled();
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function serviceFeePercent(): number {
  const value = Number(process.env.SERVICE_FEE_PERCENT ?? 10);
  return Number.isFinite(value) && value >= 0 && value <= 50 ? value : 10;
}

/** Délai laissé au propriétaire pour répondre à une demande. */
export const REQUEST_TTL_HOURS = 48;
/** Durée maximale d'une location. */
export const MAX_RENTAL_DAYS = 60;
/** Réservation possible jusqu'à N jours à l'avance. */
export const MAX_ADVANCE_DAYS = 180;
/** Délai pour laisser un avis après la fin de la location. */
export const REVIEW_WINDOW_DAYS = 30;
export const MAX_PHOTOS = 6;

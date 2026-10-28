import "server-only";
import { prisma } from "./db";

/**
 * Notification in-app. En production, brancher ici l'envoi d'e-mails / SMS
 * (ex. Brevo, Twilio) — les numéros +590 / +594 / +596 sont gérés par la plupart des fournisseurs.
 */
export async function notify(userId: string, title: string, body: string, link?: string) {
  await prisma.notification.create({ data: { userId, title, body, link } });
  if (process.env.NODE_ENV !== "test") console.info(`[notification] ${userId} — ${title}`);
}

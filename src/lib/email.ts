import { createTransport, type Transporter } from "nodemailer";
import { APP_NAME, appUrl, emailEnabled } from "./config";

type Mail = { to: string; subject: string; text: string; actionUrl?: string; actionLabel?: string };

let transporter: Transporter | null = null;

function getTransporter() {
  transporter ??= createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderHtml({ subject, text, actionUrl, actionLabel }: Mail): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = actionUrl
    ? `<p style="margin:24px 0"><a href="${escapeHtml(actionUrl)}" style="background:#0b6e4f;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">${escapeHtml(actionLabel ?? "Ouvrir")}</a></p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f5f0;padding:24px;color:#1c1c1a">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
<p style="font-size:20px;font-weight:800;color:#0b6e4f;margin:0 0 20px">${APP_NAME}</p>
<h1 style="font-size:18px;margin:0 0 16px">${escapeHtml(subject)}</h1>${paragraphs}${button}
<p style="font-size:12px;color:#77756d;margin-top:28px">Vous recevez cet e-mail car vous avez un compte sur ${APP_NAME} (${escapeHtml(appUrl())}).</p>
</div></body></html>`;
}

/** Envoie un e-mail ; sans SMTP configuré, l'e-mail est écrit dans les logs. */
export async function sendEmail(mail: Mail): Promise<void> {
  const text = mail.actionUrl ? `${mail.text}\n\n${mail.actionLabel ?? "Lien"} : ${mail.actionUrl}` : mail.text;
  if (!emailEnabled()) {
    console.info(`[e-mail non envoyé — SMTP non configuré] À: ${mail.to} | ${mail.subject}\n${text}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM ?? `${APP_NAME} <no-reply@zouti97.fr>`,
      to: mail.to,
      subject: `${mail.subject} – ${APP_NAME}`,
      text,
      html: renderHtml(mail),
    });
  } catch (err) {
    console.error("Échec d'envoi d'e-mail", err);
  }
}

/**
 * E-mail de test pour l'administration : renvoie la configuration utilisée (sans mot de passe)
 * et laisse remonter l'erreur exacte du serveur SMTP, que sendEmail se contente de journaliser.
 */
export async function sendTestEmail(to: string): Promise<string> {
  if (!emailEnabled()) throw new Error("SMTP_HOST n'est pas défini : le site écrit les e-mails dans ses logs au lieu de les envoyer.");
  const from = process.env.SMTP_FROM ?? `${APP_NAME} <no-reply@zouti97.fr>`;
  const config = `serveur ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587}, identifiant ${process.env.SMTP_USER || "(aucun)"}, expéditeur ${from}`;
  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject: `E-mail de test – ${APP_NAME}`,
      text: "Si vous lisez ceci, l'envoi d'e-mails de Zouti fonctionne.",
      html: renderHtml({ to, subject: "E-mail de test", text: "Si vous lisez ceci, l'envoi d'e-mails de Zouti fonctionne." }),
    });
    return `E-mail de test accepté par le serveur (${info.response ?? "OK"}) et envoyé à ${to}. Configuration : ${config}.`;
  } catch (err) {
    transporter = null; // repartir d'une connexion neuve après une correction des variables
    throw new Error(`${err instanceof Error ? err.message : String(err)} — configuration : ${config}`);
  }
}

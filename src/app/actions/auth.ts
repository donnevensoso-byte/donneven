"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  consumeEmailToken,
  createEmailToken,
  createSession,
  destroySession,
  findUserByEmail,
  getCurrentUser,
  hashPassword,
  roleForEmail,
  verifyPassword,
} from "@/lib/auth";
import { appUrl, emailEnabled } from "@/lib/config";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import type { ActionState } from "@/lib/errors";
import { COMMUNES } from "@/lib/guyane";
import { newId } from "@/lib/ids";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/text";

const communeSlugs = COMMUNES.map((c) => c.slug) as [string, ...string[]];

async function clientKey(): Promise<string> {
  return clientIp(await headers());
}


const passwordSchema = z.string().min(8, "8 caractères minimum").max(200);

const signupSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre prénom et nom").max(60),
  email: z.email("Adresse e-mail invalide").trim().max(200),
  password: passwordSchema,
  commune: z.enum(communeSlugs, { message: "Choisissez votre commune" }),
  terms: z.literal("on", { message: "Vous devez accepter les conditions d'utilisation" }),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

async function sendVerificationEmail(userId: string, email: string) {
  if (!emailEnabled()) return;
  const token = await createEmailToken(userId, "verify");
  await sendEmail({
    to: email,
    subject: "Confirmez votre adresse e-mail",
    text: "Bienvenue sur Zouti ! Confirmez votre adresse e-mail pour pouvoir publier des annonces et réserver du matériel.",
    actionUrl: `${appUrl()}/verifier/${token}`,
    actionLabel: "Confirmer mon adresse",
  });
}

export async function signupAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`signup:${await clientKey()}`, 10, 3_600_000)) {
    return { error: "Trop de tentatives. Réessayez dans une heure." };
  }
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { name, email, password, commune } = parsed.data;
  if (await findUserByEmail(email)) {
    return { fieldErrors: { email: "Un compte existe déjà avec cette adresse. Connectez-vous." } };
  }
  const id = newId();
  await db.insert(users).values({
    id,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    name,
    commune,
    role: roleForEmail(email),
    // Sans envoi d'e-mails configuré, l'adresse est considérée comme vérifiée.
    emailVerifiedAt: emailEnabled() ? null : new Date(),
  });
  await sendVerificationEmail(id, email);
  await createSession(id);
  redirect(safeRedirectPath(formData.get("next")));
}

export async function loginAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!rateLimit(`login:${await clientKey()}`, 20, 15 * 60_000) || !rateLimit(`login:${email.toLowerCase()}`, 8, 15 * 60_000)) {
    return { error: "Trop de tentatives. Patientez quelques minutes." };
  }
  const user = email ? await findUserByEmail(email) : undefined;
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) return { error: "E-mail ou mot de passe incorrect." };
  if (user.bannedAt) return { error: "Ce compte a été suspendu. Contactez-nous si vous pensez qu'il s'agit d'une erreur." };
  const role = roleForEmail(user.email);
  if (role === "admin" && user.role !== "admin") {
    await db.update(users).set({ role }).where(eq(users.id, user.id));
  }
  await createSession(user.id);
  redirect(safeRedirectPath(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!rateLimit(`forgot:${await clientKey()}`, 5, 3_600_000)) return { error: "Trop de demandes. Réessayez plus tard." };
  const user = email ? await findUserByEmail(email) : undefined;
  if (user && !user.bannedAt) {
    const token = await createEmailToken(user.id, "reset");
    await sendEmail({
      to: user.email,
      subject: "Réinitialisez votre mot de passe",
      text: "Vous avez demandé à changer votre mot de passe. Ce lien est valable 2 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      actionUrl: `${appUrl()}/reinitialiser/${token}`,
      actionLabel: "Choisir un nouveau mot de passe",
    });
  }
  // Même réponse que le compte existe ou non (pas d'énumération des comptes).
  return { message: "Si un compte existe avec cette adresse, vous allez recevoir un e-mail avec un lien de réinitialisation." };
}

export async function resetPasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };
  if (formData.get("password") !== formData.get("confirm")) return { fieldErrors: { confirm: "Les mots de passe ne correspondent pas" } };
  const userId = await consumeEmailToken(token, "reset");
  if (!userId) return { error: "Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande." };
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data), emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await createSession(userId);
  redirect("/compte?motdepasse=1");
}

export async function resendVerificationAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Connectez-vous." };
  if (user.emailVerifiedAt) return { message: "Votre adresse est déjà confirmée." };
  if (!rateLimit(`verify:${user.id}`, 3, 3_600_000)) return { error: "E-mail déjà renvoyé. Vérifiez vos spams." };
  await sendVerificationEmail(user.id, user.email);
  return { message: "E-mail envoyé ! Pensez à vérifier vos courriers indésirables." };
}

export async function changePasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Connectez-vous." };
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(String(formData.get("current") ?? ""), row.passwordHash))) {
    return { fieldErrors: { current: "Mot de passe actuel incorrect" } };
  }
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data) }).where(eq(users.id, user.id));
  return { message: "Mot de passe modifié." };
}

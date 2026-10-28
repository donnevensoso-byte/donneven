import "server-only";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminEmails, requireEmailVerification } from "./config";
import { db } from "./db";
import { emailTokens, sessions, users, type User } from "./db/schema";
import { newToken, sha256 } from "./ids";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "zouti_session";
const SESSION_DAYS = 60;

export { hashPassword, verifyPassword };

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  return user;
}

export function roleForEmail(email: string): "admin" | "user" {
  return adminEmails().includes(email.trim().toLowerCase()) ? "admin" : "user";
}

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && (process.env.APP_URL ?? "").startsWith("https://"),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = Pick<
  User,
  "id" | "email" | "name" | "phone" | "commune" | "role" | "avatarImageId" | "emailVerifiedAt" | "stripeAccountId" | "stripeOnboarded"
>;

/** Utilisateur connecté, ou null. Mis en cache pour la durée de la requête. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      commune: users.commune,
      role: users.role,
      avatarImageId: users.avatarImageId,
      emailVerifiedAt: users.emailVerifiedAt,
      stripeAccountId: users.stripeAccountId,
      stripeOnboarded: users.stripeOnboarded,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date()), isNull(users.bannedAt)))
    .limit(1);
  return row ?? null;
});

/** Exige une connexion ; redirige vers la page de connexion sinon. */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

export function isVerified(user: Pick<User, "emailVerifiedAt">): boolean {
  return !requireEmailVerification() || Boolean(user.emailVerifiedAt);
}

export async function createEmailToken(userId: string, type: "verify" | "reset"): Promise<string> {
  const token = newToken();
  const ttlHours = type === "verify" ? 72 : 2;
  await db.insert(emailTokens).values({
    id: sha256(token),
    userId,
    type,
    expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
  });
  return token;
}

/** Consomme un jeton à usage unique ; renvoie l'identifiant de l'utilisateur. */
export async function consumeEmailToken(token: string, type: "verify" | "reset"): Promise<string | null> {
  const [row] = await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailTokens.id, sha256(token)),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: emailTokens.userId });
  return row?.userId ?? null;
}


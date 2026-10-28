import { desc, eq, sql } from "drizzle-orm";
import { CONTACT_EMAIL } from "../config";
import { db } from "../db";
import { bookings, listings, reports, sessions, users } from "../db/schema";
import { sendEmail } from "../email";
import { UserError } from "../errors";
import { newId } from "../ids";
import { rateLimit } from "../rate-limit";
import { REPORT_REASONS } from "./moderation-reasons";
import { notify } from "./notifications";

export async function createReport(
  reporterId: string,
  target: { listingId?: string; userId?: string },
  reason: string,
  details?: string,
) {
  if (!target.listingId && !target.userId) throw new UserError("Rien à signaler.");
  if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) throw new UserError("Choisissez un motif.");
  if (!rateLimit(`report:${reporterId}`, 10, 3_600_000)) throw new UserError("Trop de signalements. Réessayez plus tard.");
  await db.insert(reports).values({
    id: newId(),
    reporterId,
    listingId: target.listingId ?? null,
    userId: target.userId ?? null,
    reason,
    details: details?.trim().slice(0, 1000) || null,
  });
}

export async function adminStats() {
  const [row] = await db
    .select({
      users: sql<number>`(select count(*)::int from ${users})`,
      usersWeek: sql<number>`(select count(*)::int from ${users} where created_at > now() - interval '7 days')`,
      listings: sql<number>`(select count(*)::int from ${listings} where status = 'active')`,
      bookings: sql<number>`(select count(*)::int from ${bookings})`,
      completed: sql<number>`(select count(*)::int from ${bookings} where status = 'completed')`,
      volume: sql<number>`(select coalesce(sum(rental_amount), 0)::int from ${bookings} where status in ('accepted', 'ongoing', 'completed'))`,
      openReports: sql<number>`(select count(*)::int from ${reports} where status = 'open')`,
    })
    .from(sql`(select 1) as one`);
  return row;
}

export async function listReports() {
  return db
    .select({
      report: reports,
      reporterName: users.name,
      listingTitle: sql<string | null>`(select l.title from ${listings} l where l.id = ${reports.listingId})`,
      listingStatus: sql<string | null>`(select l.status from ${listings} l where l.id = ${reports.listingId})`,
      targetName: sql<string | null>`(select u.name from ${users} u where u.id = ${reports.userId})`,
      targetBanned: sql<boolean>`coalesce((select u.banned_at is not null from ${users} u where u.id = ${reports.userId}), false)`,
    })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterId))
    .orderBy(sql`case when ${reports.status} = 'open' then 0 else 1 end`, desc(reports.createdAt))
    .limit(200);
}

export async function recentUsers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email, commune: users.commune, createdAt: users.createdAt, bannedAt: users.bannedAt, role: users.role })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);
}

export async function resolveReport(reportId: string) {
  await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, reportId));
}

export async function setListingHidden(listingId: string, hidden: boolean) {
  const [listing] = await db
    .update(listings)
    .set({ status: hidden ? "hidden" : "active" })
    .where(sql`${listings.id} = ${listingId} and ${listings.status} in ('active', 'paused', 'hidden')`)
    .returning({ ownerId: listings.ownerId, title: listings.title });
  if (listing) {
    await notify(listing.ownerId, {
      title: hidden ? "Annonce retirée par la modération" : "Annonce rétablie",
      body: hidden
        ? `Votre annonce « ${listing.title} » a été retirée car elle ne respecte pas nos conditions d'utilisation. Vous pouvez contester cette décision en nous écrivant à ${CONTACT_EMAIL}.`
        : `Votre annonce « ${listing.title} » est de nouveau visible.`,
      link: `/annonces/${listingId}`,
      email: true,
    });
  }
}

export async function setUserBanned(userId: string, banned: boolean) {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new UserError("Utilisateur introuvable.");
  if (user.role === "admin") throw new UserError("Impossible de bannir un administrateur.");
  const [updated] = await db
    .update(users)
    .set({ bannedAt: banned ? new Date() : null })
    .where(eq(users.id, userId))
    .returning({ email: users.email });
  if (banned) await db.delete(sessions).where(eq(sessions.userId, userId));
  await sendEmail({
    to: updated.email,
    subject: banned ? "Votre compte a été suspendu" : "Votre compte est rétabli",
    text: banned
      ? `Votre compte Zouti a été suspendu suite à un manquement à nos conditions d'utilisation. Vos annonces ne sont plus visibles. Vous pouvez contester cette décision en répondant à ${CONTACT_EMAIL}.`
      : "Votre compte Zouti est de nouveau actif. Vous pouvez vous reconnecter.",
  });
}

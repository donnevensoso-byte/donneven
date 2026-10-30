import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { bookings, images, listings, users } from "../db/schema";
import { UserError } from "../errors";
import { COMMUNES } from "../guyane";
import { saveImage } from "./images";
import { ratingSummary } from "./reviews";

const communeSlugs = COMMUNES.map((c) => c.slug) as [string, ...string[]];

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre prénom et nom").max(60),
  commune: z.enum(communeSlugs, { message: "Choisissez votre commune" }),
  phone: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .refine((v) => v === "" || /^(\+\d{8,15}|0\d{9})$/.test(v), "Numéro invalide (ex. 0694 12 34 56)")
    .transform((v) => (v === "" ? null : v)),
  bio: z
    .string()
    .trim()
    .max(500, "500 caractères maximum")
    .transform((v) => (v === "" ? null : v)),
});

export async function updateProfile(userId: string, input: z.output<typeof profileSchema>, avatar?: Buffer) {
  let avatarImageId: string | undefined;
  if (avatar) avatarImageId = await saveImage(userId, avatar);
  const [previous] = await db.select({ avatarImageId: users.avatarImageId }).from(users).where(eq(users.id, userId)).limit(1);
  await db
    .update(users)
    .set({ ...input, ...(avatarImageId ? { avatarImageId } : {}) })
    .where(eq(users.id, userId));
  if (avatarImageId && previous?.avatarImageId) {
    await db.delete(images).where(eq(images.id, previous.avatarImageId));
  }
}

export async function getPublicProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      commune: users.commune,
      bio: users.bio,
      avatarImageId: users.avatarImageId,
      createdAt: users.createdAt,
      bannedAt: users.bannedAt,
      emailVerifiedAt: users.emailVerifiedAt,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user || user.bannedAt) return null;
  const [rating, [stats]] = await Promise.all([
    ratingSummary(userId),
    db
      .select({
        rentalsAsOwner: sql<number>`(select count(*)::int from ${bookings} b where b.owner_id = ${userId} and b.status = 'completed')`,
        rentalsAsRenter: sql<number>`(select count(*)::int from ${bookings} b where b.renter_id = ${userId} and b.status = 'completed')`,
        listingCount: sql<number>`(select count(*)::int from ${listings} l where l.owner_id = ${userId} and l.status = 'active')`,
        // Taux de réponse aux demandes reçues (acceptées ou refusées avant expiration)
        answered: sql<number>`(select count(*)::int from ${bookings} b where b.owner_id = ${userId} and b.responded_at is not null)`,
        received: sql<number>`(select count(*)::int from ${bookings} b where b.owner_id = ${userId} and b.status <> 'pending' and not (b.status = 'cancelled' and b.responded_at is null))`,
        // Délai de réponse habituel (médiane des 10 dernières réponses), en heures
        typicalResponseHours: sql<number | null>`(select round(percentile_cont(0.5) within group (order by extract(epoch from r.responded_at - r.created_at) / 3600))::int
          from (select b.responded_at, b.created_at from ${bookings} b where b.owner_id = ${userId} and b.responded_at is not null order by b.responded_at desc limit 10) r)`,
      })
      .from(sql`(select 1) as one`),
  ]);
  const { phone, ...publicFields } = user; // le numéro n'est jamais exposé sur le profil public
  return {
    ...publicFields,
    rating,
    stats: {
      ...stats,
      responseRate: stats.received > 0 ? Math.round((stats.answered / stats.received) * 100) : null,
      hasPhone: Boolean(phone),
    },
  };
}

export async function getAccount(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new UserError("Compte introuvable.");
  return user;
}

export async function deleteAccount(userId: string) {
  const [open] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        sql`(${bookings.renterId} = ${userId} or ${bookings.ownerId} = ${userId})`,
        sql`${bookings.status} in ('pending', 'accepted', 'ongoing')`,
      ),
    )
    .limit(1);
  if (open) throw new UserError("Vous avez des réservations en cours. Terminez-les ou annulez-les avant de supprimer votre compte.");
  await db.delete(users).where(eq(users.id, userId));
}

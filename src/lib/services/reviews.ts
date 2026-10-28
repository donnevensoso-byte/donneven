import { and, desc, eq, sql } from "drizzle-orm";
import { REVIEW_WINDOW_DAYS } from "../config";
import { db } from "../db";
import { bookings, listings, reviews, users } from "../db/schema";
import { UserError } from "../errors";
import { newId } from "../ids";
import { firstName } from "../text";
import { notify } from "./notifications";

export function canReview(
  booking: { status: string; returnedAt: Date | null },
  existing: { authorId: string }[],
  userId: string,
): boolean {
  if (booking.status !== "completed" || !booking.returnedAt) return false;
  if (existing.some((r) => r.authorId === userId)) return false;
  return Date.now() - booking.returnedAt.getTime() < REVIEW_WINDOW_DAYS * 86_400_000;
}

export async function createReview(authorId: string, bookingId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new UserError("Choisissez une note de 1 à 5 étoiles.");
  const text = comment.trim();
  if (text.length < 10) throw new UserError("Votre avis doit faire au moins 10 caractères.");
  if (text.length > 1000) throw new UserError("1000 caractères maximum.");
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || (booking.renterId !== authorId && booking.ownerId !== authorId)) throw new UserError("Réservation introuvable.");
  const existing = await db.select({ authorId: reviews.authorId }).from(reviews).where(eq(reviews.bookingId, bookingId));
  if (!canReview(booking, existing, authorId)) throw new UserError("Vous ne pouvez pas (ou plus) laisser d'avis pour cette location.");
  const role = booking.renterId === authorId ? "renter" : "owner";
  const targetId = role === "renter" ? booking.ownerId : booking.renterId;
  await db
    .insert(reviews)
    .values({ id: newId(), bookingId, listingId: booking.listingId, authorId, targetId, role, rating, comment: text })
    .onConflictDoNothing();
  const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, authorId)).limit(1);
  await notify(targetId, {
    title: "Vous avez reçu un avis",
    body: `${firstName(author?.name ?? "Un membre")} vous a laissé ${rating} étoile${rating > 1 ? "s" : ""}.`,
    link: `/profil/${targetId}`,
  });
}

export async function ratingSummary(userId: string): Promise<{ average: number | null; count: number }> {
  const [row] = await db
    .select({ average: sql<number | null>`avg(${reviews.rating})::float`, count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.targetId, userId));
  return { average: row?.average ?? null, count: row?.count ?? 0 };
}

const reviewFields = {
  id: reviews.id,
  rating: reviews.rating,
  comment: reviews.comment,
  role: reviews.role,
  createdAt: reviews.createdAt,
  authorId: reviews.authorId,
  authorName: users.name,
  authorAvatarId: users.avatarImageId,
  listingId: reviews.listingId,
  listingTitle: listings.title,
};

export async function reviewsForUser(userId: string, limit = 30) {
  return db
    .select(reviewFields)
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .innerJoin(listings, eq(listings.id, reviews.listingId))
    .where(eq(reviews.targetId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function reviewsForListing(listingId: string, limit = 20) {
  return db
    .select(reviewFields)
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .innerJoin(listings, eq(listings.id, reviews.listingId))
    .where(and(eq(reviews.listingId, listingId), eq(reviews.role, "renter")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

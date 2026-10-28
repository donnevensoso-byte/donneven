import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { favorites, listings, users } from "../db/schema";
import { listingCardFields, type ListingCard } from "./listings";

export async function toggleFavorite(userId: string, listingId: string): Promise<boolean> {
  const deleted = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
    .returning();
  if (deleted.length > 0) return false;
  const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) return false;
  await db.insert(favorites).values({ userId, listingId }).onConflictDoNothing();
  return true;
}

export async function isFavorite(userId: string, listingId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
    .limit(1);
  return Boolean(row);
}

export async function favoriteIds(userId: string): Promise<Set<string>> {
  const rows = await db.select({ id: favorites.listingId }).from(favorites).where(eq(favorites.userId, userId));
  return new Set(rows.map((r) => r.id));
}

export async function listFavorites(userId: string): Promise<ListingCard[]> {
  return db
    .select(listingCardFields)
    .from(favorites)
    .innerJoin(listings, eq(listings.id, favorites.listingId))
    .innerJoin(users, eq(users.id, listings.ownerId))
    .where(and(eq(favorites.userId, userId), eq(listings.status, "active")))
    .orderBy(desc(favorites.createdAt));
}

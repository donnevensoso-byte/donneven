import { and, asc, desc, eq, gte, inArray, isNull, ne, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { MAX_PHOTOS } from "../config";
import { db } from "../db";
import { blockedPeriods, bookings, images, listingImages, listings, reviews, users } from "../db/schema";
import { addDays, isIsoDate, todayInGuyane } from "../dates";
import { UserError } from "../errors";
import { CATEGORIES, COMMUNES, CONDITIONS, getCommune, isInGuyane } from "../guyane";
import { newId } from "../ids";
import { parseEuros } from "../money";
import { normalizeText } from "../text";
import { saveImage } from "./images";

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];
const communeSlugs = COMMUNES.map((c) => c.slug) as [string, ...string[]];
const conditionValues = CONDITIONS.map((c) => c.value) as [string, ...string[]];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Montant saisi en euros → centimes ; null si le champ est vide. */
const euros = (opts: { min: number; max: number }) =>
  z
    .string()
    .optional()
    .transform((raw, ctx): number | null => {
      if (raw == null || raw.trim() === "") return null;
      const cents = parseEuros(raw);
      if (cents == null) {
        ctx.addIssue({ code: "custom", message: "Montant invalide (ex. 15 ou 12,50)" });
        return z.NEVER;
      }
      if (cents < opts.min * 100 || cents > opts.max * 100) {
        ctx.addIssue({ code: "custom", message: `Entre ${opts.min} € et ${opts.max} €` });
        return z.NEVER;
      }
      return cents;
    });

const requiredEuros = (opts: { min: number; max: number; label: string }) =>
  euros(opts)
    .refine((v) => v != null, `Indiquez ${opts.label}`)
    .transform((v) => v ?? 0);

const coordinate = z
  .string()
  .optional()
  .transform((v) => (v == null || v.trim() === "" ? null : Number(v)))
  .refine((v) => v == null || Number.isFinite(v), "Coordonnée invalide");

export const listingFormSchema = z
  .object({
    title: z.string().trim().min(5, "Le titre doit faire au moins 5 caractères").max(80, "80 caractères maximum"),
    description: z
      .string()
      .trim()
      .min(20, "Décrivez votre matériel en au moins 20 caractères")
      .max(3000, "3000 caractères maximum"),
    category: z.enum(categorySlugs, { message: "Choisissez une catégorie" }),
    brand: optionalText(60),
    condition: z.enum(conditionValues, { message: "Indiquez l'état du matériel" }),
    dayPrice: requiredEuros({ min: 1, max: 1000, label: "un prix par jour" }),
    weekPrice: euros({ min: 1, max: 5000 }),
    deposit: euros({ min: 0, max: 5000 }).transform((v) => v ?? 0),
    minDays: z.coerce.number().int().min(1).max(30).default(1),
    commune: z.enum(communeSlugs, { message: "Choisissez votre commune" }),
    neighborhood: optionalText(80),
    lat: coordinate,
    lng: coordinate,
    delivery: z
      .string()
      .optional()
      .transform((v) => v === "on" || v === "true"),
    pickupNotes: optionalText(500),
  })
  .superRefine((data, ctx) => {
    if (data.weekPrice != null && data.weekPrice >= data.dayPrice * 7) {
      ctx.addIssue({
        code: "custom",
        path: ["weekPrice"],
        message: "Le prix à la semaine doit être inférieur à 7 fois le prix par jour",
      });
    }
  });

export type ListingInput = z.output<typeof listingFormSchema>;

export function parseListingForm(formData: FormData):
  | { success: true; data: ListingInput }
  | { success: false; fieldErrors: Record<string, string> } {
  const raw: Record<string, string | undefined> = {};
  for (const key of Object.keys(listingFormSchema.shape)) {
    const value = formData.get(key);
    raw[key] = typeof value === "string" ? value : undefined;
  }
  const result = listingFormSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { success: false, fieldErrors };
}

/** Position affichée : arrondie (~100 m) ou centre de la commune légèrement décalé. */
function resolveLocation(input: ListingInput): { lat: number; lng: number } {
  if (input.lat != null && input.lng != null && isInGuyane(input.lat, input.lng)) {
    return { lat: Math.round(input.lat * 1000) / 1000, lng: Math.round(input.lng * 1000) / 1000 };
  }
  const commune = getCommune(input.commune)!;
  const jitter = () => (Math.random() - 0.5) * 0.012; // ± ~650 m
  return { lat: commune.lat + jitter(), lng: commune.lng + jitter() };
}

function searchTextFor(input: Pick<ListingInput, "title" | "brand" | "description">): string {
  return normalizeText([input.title, input.brand ?? "", input.description].join(" "));
}

export async function createListing(ownerId: string, input: ListingInput, photos: Buffer[]): Promise<string> {
  if (photos.length === 0) throw new UserError("Ajoutez au moins une photo de votre matériel.");
  if (photos.length > MAX_PHOTOS) throw new UserError(`${MAX_PHOTOS} photos maximum.`);
  const imageIds: string[] = [];
  for (const photo of photos) imageIds.push(await saveImage(ownerId, photo));
  const id = newId();
  const location = resolveLocation(input);
  await db.transaction(async (tx) => {
    await tx.insert(listings).values({
      id,
      ownerId,
      title: input.title,
      description: input.description,
      category: input.category,
      brand: input.brand,
      condition: input.condition,
      dayPrice: input.dayPrice,
      weekPrice: input.weekPrice,
      deposit: input.deposit,
      minDays: input.minDays,
      commune: input.commune,
      neighborhood: input.neighborhood,
      lat: location.lat,
      lng: location.lng,
      delivery: input.delivery,
      pickupNotes: input.pickupNotes,
      searchText: searchTextFor(input),
    });
    await tx.insert(listingImages).values(imageIds.map((imageId, position) => ({ listingId: id, imageId, position })));
  });
  return id;
}

async function getOwnedListing(ownerId: string, listingId: string) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), ne(listings.status, "deleted")))
    .limit(1);
  if (!listing || listing.ownerId !== ownerId) throw new UserError("Annonce introuvable.");
  return listing;
}

export async function updateListing(
  ownerId: string,
  listingId: string,
  input: ListingInput,
  changes: { newPhotos: Buffer[]; removeImageIds: string[] },
): Promise<void> {
  const listing = await getOwnedListing(ownerId, listingId);
  const current = await db
    .select({ imageId: listingImages.imageId, position: listingImages.position })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId))
    .orderBy(asc(listingImages.position));
  const kept = current.filter((img) => !changes.removeImageIds.includes(img.imageId));
  if (kept.length + changes.newPhotos.length === 0) throw new UserError("Gardez au moins une photo.");
  if (kept.length + changes.newPhotos.length > MAX_PHOTOS) throw new UserError(`${MAX_PHOTOS} photos maximum.`);
  const newIds: string[] = [];
  for (const photo of changes.newPhotos) newIds.push(await saveImage(ownerId, photo));

  const locationChanged =
    input.commune !== listing.commune || (input.lat != null && input.lng != null);
  const location = locationChanged ? resolveLocation(input) : { lat: listing.lat, lng: listing.lng };

  await db.transaction(async (tx) => {
    await tx
      .update(listings)
      .set({
        title: input.title,
        description: input.description,
        category: input.category,
        brand: input.brand,
        condition: input.condition,
        dayPrice: input.dayPrice,
        weekPrice: input.weekPrice,
        deposit: input.deposit,
        minDays: input.minDays,
        commune: input.commune,
        neighborhood: input.neighborhood,
        lat: location.lat,
        lng: location.lng,
        delivery: input.delivery,
        pickupNotes: input.pickupNotes,
        searchText: searchTextFor(input),
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));
    if (changes.removeImageIds.length > 0) {
      await tx.delete(images).where(
        and(
          inArray(
            images.id,
            changes.removeImageIds.filter((id) => current.some((c) => c.imageId === id)),
          ),
          eq(images.ownerId, ownerId),
        ),
      );
    }
    const ordered = [...kept.map((k) => k.imageId), ...newIds];
    await tx.delete(listingImages).where(eq(listingImages.listingId, listingId));
    await tx.insert(listingImages).values(ordered.map((imageId, position) => ({ listingId, imageId, position })));
  });
}

export async function setListingStatus(ownerId: string, listingId: string, status: "active" | "paused" | "deleted") {
  const listing = await getOwnedListing(ownerId, listingId);
  if (listing.status === "hidden" && status === "active") {
    throw new UserError("Cette annonce a été masquée par la modération. Contactez-nous.");
  }
  if (status === "deleted") {
    const [open] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.listingId, listingId), inArray(bookings.status, ["accepted", "ongoing"])))
      .limit(1);
    if (open) throw new UserError("Terminez ou annulez les réservations en cours avant de supprimer l'annonce.");
  }
  await db.update(listings).set({ status, updatedAt: new Date() }).where(eq(listings.id, listingId));
}

export type SearchFilters = {
  q?: string;
  category?: string;
  commune?: string;
  maxPrice?: number; // centimes
  start?: string;
  end?: string;
  sort?: "recent" | "price_asc" | "price_desc" | "distance";
  near?: { lat: number; lng: number };
  delivery?: boolean;
  ownerId?: string;
  page?: number;
  pageSize?: number;
};

const coverImage = sql<string | null>`(select li.image_id from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`;
const listingRating = sql<number | null>`(select avg(r.rating)::float from ${reviews} r where r.listing_id = ${listings.id} and r.role = 'renter')`;
const listingReviewCount = sql<number>`(select count(*)::int from ${reviews} r where r.listing_id = ${listings.id} and r.role = 'renter')`;

export const listingCardFields = {
  id: listings.id,
  title: listings.title,
  category: listings.category,
  dayPrice: listings.dayPrice,
  weekPrice: listings.weekPrice,
  deposit: listings.deposit,
  commune: listings.commune,
  neighborhood: listings.neighborhood,
  lat: listings.lat,
  lng: listings.lng,
  delivery: listings.delivery,
  status: listings.status,
  createdAt: listings.createdAt,
  coverImageId: coverImage,
  rating: listingRating,
  reviewCount: listingReviewCount,
  ownerName: users.name,
};

export type ListingCard = {
  id: string;
  title: string;
  category: string;
  dayPrice: number;
  weekPrice: number | null;
  deposit: number;
  commune: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
  delivery: boolean;
  status: string;
  createdAt: Date;
  coverImageId: string | null;
  rating: number | null;
  reviewCount: number;
  ownerName: string;
  distanceKm?: number | null;
};

function distanceExpr(near: { lat: number; lng: number }) {
  return sql<number>`(6371 * acos(least(1, greatest(-1,
    cos(radians(${near.lat})) * cos(radians(${listings.lat})) * cos(radians(${listings.lng}) - radians(${near.lng}))
    + sin(radians(${near.lat})) * sin(radians(${listings.lat})) ))))`;
}

function unavailableDuring(start: string, end: string): SQL {
  return sql`(exists (select 1 from ${bookings} b where b.listing_id = ${listings.id}
      and b.status in ('accepted', 'ongoing') and b.start_date <= ${end} and b.end_date >= ${start})
    or exists (select 1 from ${blockedPeriods} bp where bp.listing_id = ${listings.id}
      and bp.start_date <= ${end} and bp.end_date >= ${start}))`;
}

export async function searchListings(filters: SearchFilters): Promise<{ items: ListingCard[]; total: number }> {
  const conditions: SQL[] = [eq(listings.status, "active"), isNull(users.bannedAt)];
  if (filters.q) {
    for (const word of normalizeText(filters.q).split(" ").filter((w) => w.length > 1).slice(0, 6)) {
      conditions.push(sql`${listings.searchText} like ${`%${word.replace(/[%_\\]/g, "\\$&")}%`}`);
    }
  }
  if (filters.category) conditions.push(eq(listings.category, filters.category));
  if (filters.commune) conditions.push(eq(listings.commune, filters.commune));
  if (filters.maxPrice) conditions.push(sql`${listings.dayPrice} <= ${filters.maxPrice}`);
  if (filters.delivery) conditions.push(eq(listings.delivery, true));
  if (filters.ownerId) conditions.push(eq(listings.ownerId, filters.ownerId));
  if (filters.start && filters.end && isIsoDate(filters.start) && isIsoDate(filters.end) && filters.start <= filters.end) {
    conditions.push(sql`not ${unavailableDuring(filters.start, filters.end)}`);
  }

  const where = and(...conditions);
  const pageSize = Math.min(filters.pageSize ?? 24, 100);
  const page = Math.max(1, filters.page ?? 1);
  const near = filters.near ?? (filters.commune ? getCommune(filters.commune) : undefined);
  const distance = near ? distanceExpr(near) : sql<null>`null`;

  const orderBy =
    filters.sort === "price_asc"
      ? [asc(listings.dayPrice), desc(listings.createdAt)]
      : filters.sort === "price_desc"
        ? [desc(listings.dayPrice), desc(listings.createdAt)]
        : filters.sort === "distance" && near
          ? [asc(distance), desc(listings.createdAt)]
          : [desc(listings.createdAt)];

  const [items, [{ total }]] = await Promise.all([
    db
      .select({ ...listingCardFields, distanceKm: distance })
      .from(listings)
      .innerJoin(users, eq(users.id, listings.ownerId))
      .where(where)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(listings)
      .innerJoin(users, eq(users.id, listings.ownerId))
      .where(where),
  ]);
  return { items, total };
}

export async function listingsByOwner(ownerId: string, includeInactive = false): Promise<ListingCard[]> {
  return db
    .select(listingCardFields)
    .from(listings)
    .innerJoin(users, eq(users.id, listings.ownerId))
    .where(
      and(
        eq(listings.ownerId, ownerId),
        includeInactive ? ne(listings.status, "deleted") : eq(listings.status, "active"),
      ),
    )
    .orderBy(desc(listings.createdAt));
}

export async function getListingImages(listingId: string) {
  return db
    .select({ id: listingImages.imageId, width: images.width, height: images.height })
    .from(listingImages)
    .innerJoin(images, eq(images.id, listingImages.imageId))
    .where(eq(listingImages.listingId, listingId))
    .orderBy(asc(listingImages.position));
}

/** Annonce complète pour la page de détail (null si introuvable ou supprimée). */
export async function getListingDetail(listingId: string, viewerId?: string | null) {
  const [row] = await db
    .select({
      listing: listings,
      owner: {
        id: users.id,
        name: users.name,
        commune: users.commune,
        avatarImageId: users.avatarImageId,
        createdAt: users.createdAt,
        bannedAt: users.bannedAt,
        stripeOnboarded: users.stripeOnboarded,
      },
    })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.ownerId))
    .where(and(eq(listings.id, listingId), ne(listings.status, "deleted")))
    .limit(1);
  if (!row) return null;
  const isOwner = viewerId === row.listing.ownerId;
  if (!isOwner && (row.listing.status !== "active" || row.owner.bannedAt)) {
    return null;
  }
  const [photos, unavailable] = await Promise.all([getListingImages(listingId), getUnavailablePeriods(listingId)]);
  return { ...row, photos, unavailable, isOwner };
}

export async function incrementViews(listingId: string) {
  await db
    .update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(eq(listings.id, listingId));
}

export type Period = { start: string; end: string; kind: "booked" | "blocked"; id?: string };

/** Périodes indisponibles à venir (réservations confirmées et blocages du propriétaire). */
export async function getUnavailablePeriods(listingId: string): Promise<Period[]> {
  const today = todayInGuyane();
  const [booked, blocked] = await Promise.all([
    db
      .select({ start: bookings.startDate, end: bookings.endDate })
      .from(bookings)
      .where(
        and(
          eq(bookings.listingId, listingId),
          inArray(bookings.status, ["accepted", "ongoing"]),
          gte(bookings.endDate, today),
        ),
      )
      .orderBy(asc(bookings.startDate)),
    db
      .select({ id: blockedPeriods.id, start: blockedPeriods.startDate, end: blockedPeriods.endDate })
      .from(blockedPeriods)
      .where(and(eq(blockedPeriods.listingId, listingId), gte(blockedPeriods.endDate, today)))
      .orderBy(asc(blockedPeriods.startDate)),
  ]);
  return [
    ...booked.map((p) => ({ ...p, kind: "booked" as const })),
    ...blocked.map((p) => ({ ...p, kind: "blocked" as const })),
  ].sort((a, b) => a.start.localeCompare(b.start));
}

export async function addBlockedPeriod(ownerId: string, listingId: string, start: string, end: string) {
  await getOwnedListing(ownerId, listingId);
  if (!isIsoDate(start) || !isIsoDate(end) || start > end) throw new UserError("Dates invalides.");
  if (end < todayInGuyane()) throw new UserError("Cette période est déjà passée.");
  if (start > addDays(todayInGuyane(), 400)) throw new UserError("Période trop lointaine.");
  await db.insert(blockedPeriods).values({ id: newId(), listingId, startDate: start, endDate: end });
}

export async function removeBlockedPeriod(ownerId: string, periodId: string) {
  const [period] = await db
    .select({ listingId: blockedPeriods.listingId })
    .from(blockedPeriods)
    .where(eq(blockedPeriods.id, periodId))
    .limit(1);
  if (!period) return;
  await getOwnedListing(ownerId, period.listingId);
  await db.delete(blockedPeriods).where(eq(blockedPeriods.id, periodId));
}

export async function countActiveListings(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.ownerId))
    .where(and(eq(listings.status, "active"), isNull(users.bannedAt)));
  return row?.n ?? 0;
}

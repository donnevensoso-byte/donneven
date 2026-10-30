import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../db";
import { bookingPhotos, bookings, users, type PhotoStage } from "../db/schema";
import { UserError } from "../errors";
import { firstName } from "../text";
import { saveImage } from "./images";
import { getOrCreateConversation, postSystemMessage } from "./messages";

export const MAX_PHOTOS_PER_STAGE = 8;
const RETURN_PHOTO_WINDOW_DAYS = 3;

export const STAGE_LABELS: Record<PhotoStage, string> = { handover: "à la remise", return: "au retour" };

/** Étapes auxquelles un participant peut encore ajouter des photos, selon le statut de la réservation. */
export function openPhotoStages(
  booking: { status: string; returnedAt: Date | null },
  now: Date = new Date(),
): PhotoStage[] {
  if (booking.status === "accepted") return ["handover"];
  if (booking.status === "ongoing") return ["handover", "return"];
  if (booking.status === "completed" && booking.returnedAt) {
    const open = now.getTime() - booking.returnedAt.getTime() < RETURN_PHOTO_WINDOW_DAYS * 86_400_000;
    return open ? ["return"] : [];
  }
  return [];
}

/**
 * Ajoute des photos datées à l'état des lieux. Elles servent de preuve en cas
 * de désaccord sur l'état du matériel (voir replica/fixes.md, correctif 1).
 */
export async function addBookingPhotos(
  userId: string,
  bookingId: string,
  stage: PhotoStage,
  photos: Buffer[],
  note?: string,
): Promise<number> {
  if (photos.length === 0) throw new UserError("Ajoutez au moins une photo.");
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || (booking.renterId !== userId && booking.ownerId !== userId)) throw new UserError("Réservation introuvable.");
  if (!openPhotoStages(booking).includes(stage)) {
    throw new UserError(
      stage === "handover"
        ? "Les photos de remise se prennent entre l'acceptation et le début de la location."
        : "Les photos de retour se prennent pendant la location ou dans les 3 jours suivant le retour.",
    );
  }
  const [{ n }] = await db
    .select({ n: count() })
    .from(bookingPhotos)
    .where(and(eq(bookingPhotos.bookingId, bookingId), eq(bookingPhotos.stage, stage), eq(bookingPhotos.authorId, userId)));
  if (n + photos.length > MAX_PHOTOS_PER_STAGE) {
    throw new UserError(`${MAX_PHOTOS_PER_STAGE} photos maximum par personne ${STAGE_LABELS[stage]}.`);
  }
  const text = note?.trim().slice(0, 300) || null;
  const imageIds: string[] = [];
  for (const photo of photos) imageIds.push(await saveImage(userId, photo));
  await db.insert(bookingPhotos).values(imageIds.map((imageId) => ({ bookingId, imageId, authorId: userId, stage, note: text })));

  const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  const conversationId = await getOrCreateConversation(booking.listingId, booking.renterId);
  await postSystemMessage(
    conversationId,
    `📸 ${firstName(author?.name ?? "Un membre")} a ajouté ${photos.length} photo${photos.length > 1 ? "s" : ""} à l'état des lieux ${STAGE_LABELS[stage]}.`,
  );
  return imageIds.length;
}

export type BookingPhoto = {
  imageId: string;
  stage: PhotoStage;
  note: string | null;
  createdAt: Date;
  authorId: string | null;
  authorName: string | null;
};

export async function listBookingPhotos(bookingId: string): Promise<BookingPhoto[]> {
  return db
    .select({
      imageId: bookingPhotos.imageId,
      stage: bookingPhotos.stage,
      note: bookingPhotos.note,
      createdAt: bookingPhotos.createdAt,
      authorId: bookingPhotos.authorId,
      authorName: users.name,
    })
    .from(bookingPhotos)
    .leftJoin(users, eq(users.id, bookingPhotos.authorId))
    .where(eq(bookingPhotos.bookingId, bookingId))
    .orderBy(asc(bookingPhotos.createdAt));
}

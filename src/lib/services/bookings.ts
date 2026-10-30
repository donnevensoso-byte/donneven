import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import {
  MAX_ADVANCE_DAYS,
  MAX_RENTAL_DAYS,
  REQUEST_TTL_HOURS,
  serviceFeePercent,
  stripeEnabled,
} from "../config";
import { db, type DB } from "../db";
import { blockedPeriods, bookings, listingImages, listings, reviews, users, type Booking } from "../db/schema";
import { addDays, endOfDayInGuyane, formatDateRange, isIsoDate, rentalDays, todayInGuyane } from "../dates";
import { UserError } from "../errors";
import { newId } from "../ids";
import { formatEuros } from "../money";
import { computePrice } from "../pricing";
import { rateLimit } from "../rate-limit";
import { firstName } from "../text";
import { getOrCreateConversation, postSystemMessage, sendMessage } from "./messages";
import { notify } from "./notifications";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export const ACTIVE_STATUSES = ["accepted", "ongoing"] as const;

export const STATUS_LABELS: Record<Booking["status"], string> = {
  pending: "En attente de réponse",
  accepted: "Confirmée",
  ongoing: "En cours",
  completed: "Terminée",
  declined: "Refusée",
  cancelled: "Annulée",
  expired: "Expirée",
};

export function bookingStatusLabel(b: Pick<Booking, "status" | "paymentMethod" | "paymentStatus">): string {
  if (b.status === "accepted" && b.paymentMethod === "online" && b.paymentStatus !== "paid") return "Acceptée – paiement en attente";
  return STATUS_LABELS[b.status];
}

async function isPeriodFree(
  q: DB | Tx,
  listingId: string,
  start: string,
  end: string,
  excludeBookingId?: string,
): Promise<boolean> {
  const [booked] = await q
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.listingId, listingId),
        inArray(bookings.status, [...ACTIVE_STATUSES]),
        sql`${bookings.startDate} <= ${end} and ${bookings.endDate} >= ${start}`,
        excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined,
      ),
    )
    .limit(1);
  if (booked) return false;
  const [blocked] = await q
    .select({ id: blockedPeriods.id })
    .from(blockedPeriods)
    .where(
      and(
        eq(blockedPeriods.listingId, listingId),
        sql`${blockedPeriods.startDate} <= ${end} and ${blockedPeriods.endDate} >= ${start}`,
      ),
    )
    .limit(1);
  return !blocked;
}

export type BookingRequest = { listingId: string; startDate: string; endDate: string; message?: string };

export function quoteBooking(
  listing: { dayPrice: number; weekPrice: number | null; minDays: number },
  startDate: string,
  endDate: string,
  online: boolean,
) {
  const today = todayInGuyane();
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) throw new UserError("Choisissez vos dates de location.");
  if (startDate > endDate) throw new UserError("La date de fin doit être après la date de début.");
  if (startDate < today) throw new UserError("La date de début est déjà passée.");
  if (startDate > addDays(today, MAX_ADVANCE_DAYS)) throw new UserError("Réservation possible jusqu'à 6 mois à l'avance.");
  const days = rentalDays(startDate, endDate);
  if (days > MAX_RENTAL_DAYS) throw new UserError(`Location limitée à ${MAX_RENTAL_DAYS} jours.`);
  if (days < listing.minDays) throw new UserError(`Durée minimale : ${listing.minDays} jours.`);
  return computePrice({
    dayPrice: listing.dayPrice,
    weekPrice: listing.weekPrice,
    days,
    serviceFeePercent: online ? serviceFeePercent() : 0,
  });
}

export async function requestBooking(renterId: string, req: BookingRequest): Promise<string> {
  const [row] = await db
    .select({ listing: listings, ownerBanned: users.bannedAt, ownerOnboarded: users.stripeOnboarded })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.ownerId))
    .where(eq(listings.id, req.listingId))
    .limit(1);
  if (!row || row.listing.status !== "active" || row.ownerBanned) throw new UserError("Cette annonce n'est plus disponible.");
  const { listing } = row;
  if (listing.ownerId === renterId) throw new UserError("Vous ne pouvez pas louer votre propre matériel.");
  if (!rateLimit(`booking:${renterId}`, 10, 3_600_000)) throw new UserError("Trop de demandes envoyées. Réessayez plus tard.");

  const online = stripeEnabled() && row.ownerOnboarded;
  const price = quoteBooking(listing, req.startDate, req.endDate, online);

  if (!(await isPeriodFree(db, listing.id, req.startDate, req.endDate))) {
    throw new UserError("Le matériel n'est pas disponible à ces dates.");
  }
  const [duplicate] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.listingId, listing.id),
        eq(bookings.renterId, renterId),
        eq(bookings.status, "pending"),
        sql`${bookings.startDate} <= ${req.endDate} and ${bookings.endDate} >= ${req.startDate}`,
      ),
    )
    .limit(1);
  if (duplicate) throw new UserError("Vous avez déjà une demande en attente sur ces dates.");

  const now = new Date();
  const ttl = new Date(now.getTime() + REQUEST_TTL_HOURS * 3_600_000);
  const startDeadline = endOfDayInGuyane(req.startDate);
  const id = newId();
  await db.insert(bookings).values({
    id,
    listingId: listing.id,
    renterId,
    ownerId: listing.ownerId,
    startDate: req.startDate,
    endDate: req.endDate,
    days: price.days,
    dayPrice: listing.dayPrice,
    weekPrice: listing.weekPrice,
    rentalAmount: price.rentalAmount,
    serviceFee: price.serviceFee,
    deposit: listing.deposit,
    paymentMethod: online ? "online" : "onsite",
    expiresAt: ttl < startDeadline ? ttl : startDeadline,
  });

  const conversationId = await getOrCreateConversation(listing.id, renterId);
  await postSystemMessage(
    conversationId,
    `📅 Demande de réservation ${formatDateRange(req.startDate, req.endDate)} (${price.days} j) – ${formatEuros(price.rentalAmount)}.`,
  );
  const message = req.message?.trim();
  // Le propriétaire est déjà notifié de la demande : pas de seconde notification.
  if (message) await sendMessage(renterId, conversationId, message.slice(0, 2000), { silent: true });

  const [renter] = await db.select({ name: users.name }).from(users).where(eq(users.id, renterId)).limit(1);
  await notify(listing.ownerId, {
    title: "Nouvelle demande de réservation",
    body: `${firstName(renter?.name ?? "Un membre")} souhaite louer « ${listing.title} » ${formatDateRange(req.startDate, req.endDate)}. Répondez sous 48 h.`,
    link: `/reservations/${id}`,
    email: true,
  });
  return id;
}

async function loadBooking(q: DB | Tx, bookingId: string) {
  const [row] = await q
    .select({ booking: bookings, listingTitle: listings.title })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) throw new UserError("Réservation introuvable.");
  return row;
}

async function conversationFor(b: Booking) {
  return getOrCreateConversation(b.listingId, b.renterId);
}

export async function respondToBooking(
  ownerId: string,
  bookingId: string,
  decision: "accept" | "decline",
  reason?: string,
): Promise<void> {
  await expireStaleBookings();
  const autoDeclined: Booking[] = [];
  const { booking, listingTitle } = await db.transaction(async (tx) => {
    const { booking, listingTitle } = await loadBooking(tx, bookingId);
    if (booking.ownerId !== ownerId) throw new UserError("Réservation introuvable.");
    // Verrou sur l'annonce : deux acceptations simultanées ne peuvent pas se chevaucher.
    await tx.execute(sql`select id from ${listings} where id = ${booking.listingId} for update`);
    const [fresh] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (fresh.status !== "pending") throw new UserError("Cette demande a déjà été traitée.");
    const now = new Date();
    if (decision === "decline") {
      await tx
        .update(bookings)
        .set({ status: "declined", respondedAt: now, cancelReason: reason?.slice(0, 500) || null })
        .where(eq(bookings.id, bookingId));
      return { booking: fresh, listingTitle };
    }
    if (!(await isPeriodFree(tx, fresh.listingId, fresh.startDate, fresh.endDate, fresh.id))) {
      throw new UserError("Ces dates sont déjà réservées ou bloquées.");
    }
    const online = fresh.paymentMethod === "online";
    const payDeadline = new Date(Math.min(now.getTime() + 24 * 3_600_000, endOfDayInGuyane(fresh.startDate).getTime()));
    await tx
      .update(bookings)
      .set({
        status: "accepted",
        respondedAt: now,
        handoverCode: newHandoverCode(),
        ...(online ? { paymentStatus: "pending" as const, expiresAt: payDeadline } : {}),
      })
      .where(eq(bookings.id, bookingId));
    const overlapping = await tx
      .update(bookings)
      .set({ status: "declined", respondedAt: now, cancelReason: "Dates réservées par un autre membre" })
      .where(
        and(
          eq(bookings.listingId, fresh.listingId),
          eq(bookings.status, "pending"),
          ne(bookings.id, fresh.id),
          sql`${bookings.startDate} <= ${fresh.endDate} and ${bookings.endDate} >= ${fresh.startDate}`,
        ),
      )
      .returning();
    autoDeclined.push(...overlapping);
    return { booking: fresh, listingTitle };
  });

  const conversationId = await conversationFor(booking);
  if (decision === "accept") {
    const online = booking.paymentMethod === "online";
    await postSystemMessage(
      conversationId,
      online
        ? "✅ Demande acceptée. Le locataire doit maintenant régler la location en ligne pour la confirmer."
        : "✅ Réservation confirmée ! Convenez ensemble du lieu et de l'heure de remise. Le paiement et la caution se règlent en main propre.",
    );
    await notify(booking.renterId, {
      title: online ? "Demande acceptée – finalisez le paiement" : "Réservation confirmée 🎉",
      body: `Votre demande pour « ${listingTitle} » ${formatDateRange(booking.startDate, booking.endDate)} a été acceptée.`,
      link: `/reservations/${booking.id}`,
      email: true,
    });
  } else {
    await postSystemMessage(conversationId, `❌ Demande refusée${reason ? ` : ${reason}` : ""}.`);
    await notify(booking.renterId, {
      title: "Demande refusée",
      body: `Le propriétaire n'est pas disponible pour « ${listingTitle} » ${formatDateRange(booking.startDate, booking.endDate)}. D'autres annonces peuvent vous convenir !`,
      link: `/reservations/${booking.id}`,
      email: true,
    });
  }
  for (const other of autoDeclined) {
    await postSystemMessage(await conversationFor(other), "❌ Demande refusée : ces dates viennent d'être réservées.");
    await notify(other.renterId, {
      title: "Demande refusée",
      body: `« ${listingTitle} » vient d'être réservé sur ces dates.`,
      link: `/reservations/${other.id}`,
    });
  }
}

export async function cancelBooking(userId: string, bookingId: string, reason?: string): Promise<void> {
  const { booking, listingTitle } = await loadBooking(db, bookingId);
  const isRenter = booking.renterId === userId;
  const isOwner = booking.ownerId === userId;
  if (!isRenter && !isOwner) throw new UserError("Réservation introuvable.");
  const today = todayInGuyane();
  if (booking.status === "pending") {
    if (!isRenter) throw new UserError("Pour une demande en attente, utilisez « Refuser ».");
  } else if (booking.status === "accepted") {
    if (isRenter && today >= booking.startDate) {
      throw new UserError("La location a commencé : contactez le propriétaire pour toute modification.");
    }
  } else {
    throw new UserError("Cette réservation ne peut plus être annulée.");
  }

  let paymentStatus = booking.paymentStatus;
  if (booking.paymentStatus === "paid" && booking.stripePaymentIntentId) {
    const { refundPayment } = await import("./payments");
    await refundPayment(booking.stripePaymentIntentId);
    paymentStatus = "refunded";
  }
  const [updated] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus,
      cancelledBy: isRenter ? "renter" : "owner",
      cancelReason: reason?.trim().slice(0, 500) || null,
    })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, booking.status)))
    .returning({ id: bookings.id });
  if (!updated) throw new UserError("La réservation a changé entre-temps. Rechargez la page.");

  const who = isRenter ? "le locataire" : "le propriétaire";
  await postSystemMessage(await conversationFor(booking), `🚫 Réservation annulée par ${who}${reason ? ` : ${reason}` : ""}.`);
  await notify(isRenter ? booking.ownerId : booking.renterId, {
    title: "Réservation annulée",
    body: `La réservation de « ${listingTitle} » ${formatDateRange(booking.startDate, booking.endDate)} a été annulée par ${who}.${paymentStatus === "refunded" ? " Le paiement est intégralement remboursé." : ""}`,
    link: `/reservations/${booking.id}`,
    email: true,
  });
}

/** Code à 4 chiffres que le locataire montre au propriétaire au moment de la remise. */
export function newHandoverCode(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

/**
 * Le propriétaire confirme la remise en saisissant le code du locataire :
 * la remise n'est validée que si le locataire était bien présent.
 */
export async function confirmHandover(ownerId: string, bookingId: string, code: string): Promise<void> {
  const { booking, listingTitle } = await loadBooking(db, bookingId);
  if (booking.ownerId !== ownerId) throw new UserError("Réservation introuvable.");
  if (booking.status !== "accepted") throw new UserError("Cette réservation n'est pas en attente de remise.");
  if (booking.paymentMethod === "online" && booking.paymentStatus !== "paid") {
    throw new UserError("Le locataire n'a pas encore payé la location.");
  }
  if (todayInGuyane() < addDays(booking.startDate, -1)) {
    throw new UserError("Vous pourrez confirmer la remise à partir de la veille du début de location.");
  }
  // Réservations acceptées avant l'ajout du code : pas de code à vérifier.
  if (booking.handoverCode) {
    if (!rateLimit(`handover:${bookingId}`, 5, 15 * 60_000)) {
      throw new UserError("Trop d'essais. Réessayez dans 15 minutes.");
    }
    if (code.trim() !== booking.handoverCode) {
      throw new UserError("Code incorrect. Demandez au locataire le code affiché sur sa réservation.");
    }
  }
  const [updated] = await db
    .update(bookings)
    .set({ status: "ongoing", handedOverAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "accepted")))
    .returning({ id: bookings.id });
  if (!updated) throw new UserError("La réservation a changé entre-temps. Rechargez la page.");
  await postSystemMessage(await conversationFor(booking), "🤝 Remise confirmée avec le code du locataire. Bonne location !");
  await notify(booking.renterId, {
    title: "Location en cours",
    body: `La remise de « ${listingTitle} » est confirmée. Retour prévu le ${booking.endDate.split("-").reverse().join("/")}.`,
    link: `/reservations/${booking.id}`,
  });
}

/** Le propriétaire confirme le retour du matériel : la location est terminée. */
export async function confirmReturn(ownerId: string, bookingId: string): Promise<void> {
  const { booking, listingTitle } = await loadBooking(db, bookingId);
  if (booking.ownerId !== ownerId) throw new UserError("Réservation introuvable.");
  if (booking.status !== "ongoing") {
    throw new UserError("Confirmez d'abord la remise avec le code du locataire.");
  }
  if (booking.paymentMethod === "online" && booking.paymentStatus !== "paid") {
    throw new UserError("Le locataire n'a pas encore payé la location.");
  }
  const now = new Date();
  await db
    .update(bookings)
    .set({ status: "completed", returnedAt: now, handedOverAt: booking.handedOverAt ?? now })
    .where(eq(bookings.id, bookingId));
  await postSystemMessage(
    await conversationFor(booking),
    "📦 Matériel rendu, location terminée. Pensez à vous laisser un avis mutuel !",
  );
  for (const userId of [booking.renterId, booking.ownerId]) {
    await notify(userId, {
      title: "Location terminée – laissez un avis",
      body: `Comment s'est passée la location de « ${listingTitle} » ? Votre avis aide toute la communauté.`,
      link: `/reservations/${booking.id}`,
      email: userId === booking.renterId,
    });
  }
}

/** Appelé quand Stripe confirme le paiement. Idempotent. */
export async function markBookingPaid(bookingId: string, paymentIntentId: string | null): Promise<boolean> {
  const [updated] = await db
    .update(bookings)
    .set({ paymentStatus: "paid", paidAt: new Date(), stripePaymentIntentId: paymentIntentId })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "accepted"), ne(bookings.paymentStatus, "paid")))
    .returning();
  if (!updated) return false;
  const conversationId = await conversationFor(updated);
  await postSystemMessage(conversationId, "💳 Paiement reçu : la réservation est confirmée. Convenez du lieu et de l'heure de remise.");
  await notify(updated.ownerId, {
    title: "Réservation payée",
    body: `La location ${formatDateRange(updated.startDate, updated.endDate)} est payée et confirmée.`,
    link: `/reservations/${updated.id}`,
    email: true,
  });
  return true;
}

/**
 * Expire les demandes sans réponse et les réservations acceptées mais non
 * payées. Appelé à la volée (pas besoin de tâche planifiée).
 */
export async function expireStaleBookings(): Promise<number> {
  const expired = await db
    .update(bookings)
    .set({ status: "expired" })
    .where(
      and(
        lt(bookings.expiresAt, new Date()),
        or(
          eq(bookings.status, "pending"),
          and(eq(bookings.status, "accepted"), eq(bookings.paymentMethod, "online"), ne(bookings.paymentStatus, "paid")),
        ),
      ),
    )
    .returning();
  for (const b of expired) {
    try {
      await postSystemMessage(await conversationFor(b), "⌛ Demande expirée faute de réponse ou de paiement dans les délais.");
      await notify(b.renterId, {
        title: "Demande expirée",
        body: "Votre demande de réservation a expiré. Vous pouvez en envoyer une nouvelle ou chercher un autre matériel.",
        link: `/reservations/${b.id}`,
      });
    } catch (err) {
      console.error("expireStaleBookings", err);
    }
  }
  return expired.length;
}

const otherUser = (userId: string) =>
  sql<string>`case when ${bookings.renterId} = ${userId} then ${bookings.ownerId} else ${bookings.renterId} end`;

export async function listUserBookings(userId: string, as: "renter" | "owner") {
  await expireStaleBookings();
  return db
    .select({
      booking: bookings,
      listingTitle: listings.title,
      listingImageId: sql<string | null>`(select li.image_id from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`,
      otherName: sql<string>`(select u.name from ${users} u where u.id = ${otherUser(userId)})`,
    })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .where(as === "renter" ? eq(bookings.renterId, userId) : eq(bookings.ownerId, userId))
    .orderBy(
      sql`case ${bookings.status} when 'pending' then 0 when 'accepted' then 1 when 'ongoing' then 2 else 3 end`,
      desc(bookings.startDate),
    )
    .limit(200);
}

export async function pendingRequestCount(ownerId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(eq(bookings.ownerId, ownerId), eq(bookings.status, "pending"), sql`${bookings.expiresAt} > now()`));
  return row?.n ?? 0;
}

export async function getBookingForUser(userId: string, bookingId: string) {
  await expireStaleBookings();
  const [row] = await db
    .select({
      booking: bookings,
      listing: {
        id: listings.id,
        title: listings.title,
        commune: listings.commune,
        neighborhood: listings.neighborhood,
        pickupNotes: listings.pickupNotes,
        delivery: listings.delivery,
        category: listings.category,
        brand: listings.brand,
        condition: listings.condition,
      },
      listingImageId: sql<string | null>`(select li.image_id from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`,
    })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row || (row.booking.renterId !== userId && row.booking.ownerId !== userId)) return null;
  const role = row.booking.renterId === userId ? ("renter" as const) : ("owner" as const);
  const otherId = role === "renter" ? row.booking.ownerId : row.booking.renterId;
  const [[other], [self], bookingReviews] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, phone: users.phone, email: users.email, commune: users.commune, avatarImageId: users.avatarImageId })
      .from(users)
      .where(eq(users.id, otherId))
      .limit(1),
    db.select({ id: users.id, name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(reviews).where(eq(reviews.bookingId, bookingId)),
  ]);
  const conversationId = await conversationFor(row.booking);
  return { ...row, role, other, self, reviews: bookingReviews, conversationId };
}

export async function ownerEarnings(ownerId: string): Promise<{ total: number; count: number }> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.rentalAmount}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .where(and(eq(bookings.ownerId, ownerId), eq(bookings.status, "completed")));
  return row ?? { total: 0, count: 0 };
}

import "server-only";
import { prisma } from "./db";
import { FEES } from "./constants";
import { notify } from "./notifications";
import { vehicleName } from "./format";

export async function loadBookingFor(bookingId: string, userId: string, isAdmin = false) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      vehicle: { include: { owner: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      renter: true,
    },
  });
  if (!booking) return null;
  const role = booking.renterId === userId ? "RENTER" : booking.vehicle.ownerId === userId ? "OWNER" : isAdmin ? "ADMIN" : null;
  if (!role) return null;
  return { booking, role } as const;
}

/** Passe une réservation en « confirmée » après paiement (mode démo ou webhook Stripe). */
export async function markBookingPaid(bookingId: string, paymentRef: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { vehicle: true } });
  if (!booking || booking.status !== "AWAITING_PAYMENT") return;
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID", paymentRef },
  });
  const name = vehicleName(booking.vehicle);
  await notify(booking.vehicle.ownerId, "Réservation confirmée", `La location de votre ${name} est payée et confirmée.`, `/reservations/${bookingId}`);
  await notify(booking.renterId, "Paiement reçu", `Votre location de ${name} est confirmée. Bon woulé !`, `/reservations/${bookingId}`);
}

/** Les demandes sans réponse du propriétaire expirent automatiquement. */
export async function expireStaleRequests() {
  const limit = new Date(Date.now() - FEES.requestExpiryHours * 3600 * 1000);
  const stale = await prisma.booking.findMany({
    where: { status: "PENDING", OR: [{ createdAt: { lt: limit } }, { startAt: { lt: new Date() } }] },
    include: { vehicle: true },
  });
  for (const b of stale) {
    await prisma.booking.update({
      where: { id: b.id },
      data: { status: "DECLINED", cancelReason: "Demande expirée sans réponse du propriétaire." },
    });
    await notify(b.renterId, "Demande expirée", `Le propriétaire du ${vehicleName(b.vehicle)} n'a pas répondu à temps. Essayez un autre véhicule !`, "/recherche");
  }
}

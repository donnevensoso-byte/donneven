"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FEES, INSURANCE_PLANS, PICKUP_OPTIONS, type InsurancePlan, type PickupOption, type BookingStatus } from "@/lib/constants";
import { computePrice, ageAt, isYoungDriver } from "@/lib/pricing";
import { isRangeFree } from "@/lib/availability";
import { zonedDate } from "@/lib/dates";
import { findHub } from "@/lib/territories";
import { hasSevereWeather, takenRanges } from "@/lib/queries";
import { computeCancellation } from "@/lib/cancellation";
import { notify } from "@/lib/notifications";
import { createCheckout, refund, stripeEnabled } from "@/lib/payments";
import { loadBookingFor, markBookingPaid } from "@/lib/bookings";
import { euros, vehicleName } from "@/lib/format";
import { saveUploads } from "@/lib/uploads";
import type { FormState } from "@/components/FormMessage";
import { firstError, formObject } from "./_utils";

const bookingSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date de départ."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date de retour."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  insurancePlan: z.enum(Object.keys(INSURANCE_PLANS) as [InsurancePlan, ...InsurancePlan[]]).default("ESSENTIELLE"),
  pickupOption: z.enum(Object.keys(PICKUP_OPTIONS) as [PickupOption, ...PickupOption[]]).default("SUR_PLACE"),
  message: z.string().max(1000).default(""),
});

export async function createBooking(vehicleId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(`/vehicules/${vehicleId}`);
  const parsed = bookingSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.status !== "ACTIVE") return { error: "Ce véhicule n'est plus disponible à la location." };
  if (vehicle.ownerId === user.id) return { error: "Vous ne pouvez pas louer votre propre véhicule." };

  // Conducteur
  if (user.licenseStatus === "NONE" || user.licenseStatus === "REJECTED")
    return { error: "Ajoutez votre permis de conduire dans votre profil avant de réserver." };
  if (!user.birthDate || ageAt(user.birthDate) < FEES.minAge)
    return { error: `Il faut avoir au moins ${FEES.minAge} ans pour louer un véhicule sur Woulé.` };

  // Dates
  const startAt = zonedDate(vehicle.territory, d.start, d.startTime);
  const endAt = zonedDate(vehicle.territory, d.end, d.endTime);
  if (!startAt || !endAt) return { error: "Dates invalides." };
  if (startAt.getTime() < Date.now() + 2 * 3600 * 1000) return { error: "Le départ doit avoir lieu au moins 2 h après la réservation." };
  if (endAt <= startAt) return { error: "Le retour doit être après le départ." };

  const price = computePrice({
    vehicle,
    startAt,
    endAt,
    insurancePlan: d.insurancePlan,
    pickupOption: d.pickupOption,
    youngDriver: isYoungDriver(user.licenseIssuedAt, startAt),
  });
  if (price.days < vehicle.minDays) return { error: `Durée minimum de location : ${vehicle.minDays} jour(s).` };
  if (price.days > vehicle.maxDays) return { error: `Durée maximum de location : ${vehicle.maxDays} jours.` };
  if (d.pickupOption === "AEROPORT" && !vehicle.airportDelivery) return { error: "La livraison à l'aéroport n'est pas proposée." };
  if (d.pickupOption === "PORT" && !vehicle.portDelivery) return { error: "La livraison au port n'est pas proposée." };

  if ((await hasSevereWeather(vehicle.territory)) && startAt.getTime() < Date.now() + 72 * 3600 * 1000)
    return { error: "Vigilance météo en cours : les nouvelles locations sont suspendues pour les 72 prochaines heures. Restez prudents !" };

  if (!isRangeFree({ startAt, endAt }, await takenRanges(vehicleId)))
    return { error: "Le véhicule n'est pas disponible sur ces dates." };

  const hub = d.pickupOption === "SUR_PLACE" ? null : findHub(vehicle.territory, d.pickupOption);
  const booking = await prisma.booking.create({
    data: {
      vehicleId,
      renterId: user.id,
      startAt,
      endAt,
      status: vehicle.instantBooking ? "AWAITING_PAYMENT" : "PENDING",
      insurancePlan: d.insurancePlan,
      pickupOption: d.pickupOption,
      pickupLabel: hub?.name ?? `${vehicle.commune}`,
      message: d.message,
      days: price.days,
      basePrice: price.basePrice,
      discount: price.discount,
      deliveryFee: price.deliveryFee,
      insuranceFee: price.insuranceFee,
      youngDriverFee: price.youngDriverFee,
      serviceFee: price.serviceFee,
      total: price.total,
      ownerPayout: price.ownerPayout,
      deposit: price.deposit,
      ...(d.message ? { messages: { create: { senderId: user.id, body: d.message } } } : {}),
    },
  });

  const name = vehicleName(vehicle);
  await notify(
    vehicle.ownerId,
    vehicle.instantBooking ? "Nouvelle réservation instantanée" : "Nouvelle demande de location",
    `${user.firstName} souhaite louer votre ${name} (${price.days} j, ${euros(price.ownerPayout)} pour vous).`,
    `/reservations/${booking.id}`,
  );
  redirect(`/reservations/${booking.id}`);
}

async function bookingForAction(bookingId: string) {
  const user = await requireUser();
  const ctx = await loadBookingFor(bookingId, user.id, user.role === "ADMIN");
  if (!ctx) throw new Error("Réservation introuvable.");
  return { user, ...ctx };
}

export async function respondToRequest(bookingId: string, accept: boolean) {
  const { booking, role } = await bookingForAction(bookingId);
  if (role !== "OWNER" || booking.status !== "PENDING") return;
  if (accept) {
    const free = isRangeFree(booking, await takenRanges(booking.vehicleId, booking.id));
    if (!free) {
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "DECLINED", cancelReason: "Véhicule déjà réservé sur ces dates." } });
    } else {
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "AWAITING_PAYMENT" } });
    }
  } else {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "DECLINED" } });
  }
  const name = vehicleName(booking.vehicle);
  await notify(
    booking.renterId,
    accept ? "Demande acceptée 🎉" : "Demande refusée",
    accept ? `${booking.vehicle.owner.firstName} a accepté votre demande pour le ${name}. Finalisez le paiement pour confirmer.` : `Votre demande pour le ${name} n'a pas été acceptée.`,
    `/reservations/${bookingId}`,
  );
  revalidatePath(`/reservations/${bookingId}`);
}

export async function payBooking(bookingId: string) {
  const { user, booking, role } = await bookingForAction(bookingId);
  if (role !== "RENTER" || booking.status !== "AWAITING_PAYMENT") return;
  if (stripeEnabled()) {
    const session = await createCheckout({
      id: booking.id,
      total: booking.total,
      email: user.email,
      label: `Location ${vehicleName(booking.vehicle)} — ${booking.days} jour(s)`,
    });
    if (session.url) redirect(session.url);
    return;
  }
  redirect(`/reservations/${bookingId}/paiement`);
}

/** Paiement simulé (mode démo, sans Stripe). */
export async function confirmDemoPayment(bookingId: string) {
  if (stripeEnabled()) return;
  const { booking, role } = await bookingForAction(bookingId);
  if (role !== "RENTER" || booking.status !== "AWAITING_PAYMENT") return;
  await markBookingPaid(bookingId, `demo_${Date.now()}`);
  redirect(`/reservations/${bookingId}?paiement=ok`);
}

export async function cancelBooking(bookingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { booking, role } = await bookingForAction(bookingId);
  const reason = String(fd.get("reason") ?? "").slice(0, 500);
  const result = computeCancellation({
    status: booking.status as BookingStatus,
    paid: booking.paymentStatus === "PAID",
    total: booking.total,
    serviceFee: booking.serviceFee,
    startAt: booking.startAt,
    now: new Date(),
    by: role,
    severeWeather: await hasSevereWeather(booking.vehicle.territory),
  });
  if (!result.allowed) return { error: result.policy };

  await refund(booking.paymentRef, result.refund);
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledBy: role,
      cancelReason: reason || null,
      refundAmount: result.refund,
      paymentStatus:
        booking.paymentStatus !== "PAID" ? booking.paymentStatus : result.refund >= booking.total ? "REFUNDED" : "PARTIALLY_REFUNDED",
    },
  });
  const name = vehicleName(booking.vehicle);
  const other = role === "RENTER" ? booking.vehicle.ownerId : booking.renterId;
  await notify(other, "Réservation annulée", `La location du ${name} a été annulée.${reason ? ` Motif : ${reason}` : ""}`, `/reservations/${bookingId}`);
  if (role !== "RENTER" && result.refund > 0)
    await notify(booking.renterId, "Remboursement en cours", `${euros(result.refund)} vous seront remboursés sous 5 à 10 jours.`, `/reservations/${bookingId}`);
  revalidatePath(`/reservations/${bookingId}`);
  return { success: `${result.policy}${result.refund ? ` Montant remboursé : ${euros(result.refund)}.` : ""}` };
}

const inspectionSchema = z.object({
  type: z.enum(["CHECKIN", "CHECKOUT"]),
  mileage: z.coerce.number({ message: "Kilométrage invalide." }).int().min(0).max(999999),
  fuelLevel: z.coerce.number().int().min(0).max(8),
  cleanliness: z.enum(["PROPRE", "CORRECT", "SALE"]),
  damages: z.string().max(1000).default(""),
});

export async function submitInspection(bookingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { user, booking, role } = await bookingForAction(bookingId);
  if (role === "ADMIN") return { error: "Action réservée au locataire et au propriétaire." };
  const parsed = inspectionSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;

  if (d.type === "CHECKIN") {
    if (booking.status !== "CONFIRMED") return { error: "La réservation doit être confirmée pour démarrer la location." };
    if (booking.startAt.getTime() - Date.now() > 24 * 3600 * 1000)
      return { error: "L'état des lieux de départ peut être fait au plus tôt 24 h avant le début de la location." };
  } else {
    if (booking.status !== "IN_PROGRESS") return { error: "La location n'a pas encore démarré." };
    const checkin = await prisma.inspection.findUnique({ where: { bookingId_type: { bookingId, type: "CHECKIN" } } });
    if (checkin && d.mileage < checkin.mileage) return { error: `Le kilométrage doit être supérieur à celui du départ (${checkin.mileage} km).` };
  }

  let photos: string[];
  try {
    photos = await saveUploads(fd.getAll("photos"), 12);
  } catch (e) {
    return { error: (e as Error).message };
  }

  await prisma.inspection.create({
    data: { bookingId, authorId: user.id, ...d, photos: photos.join(",") },
  });
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: d.type === "CHECKIN" ? "IN_PROGRESS" : "COMPLETED" },
  });
  const other = role === "RENTER" ? booking.vehicle.ownerId : booking.renterId;
  const name = vehicleName(booking.vehicle);
  await notify(
    other,
    d.type === "CHECKIN" ? "Location démarrée" : "Location terminée",
    d.type === "CHECKIN"
      ? `L'état des lieux de départ du ${name} a été réalisé (${d.mileage} km).`
      : `Le ${name} a été restitué. Laissez un avis pour aider la communauté !`,
    `/reservations/${bookingId}`,
  );
  revalidatePath(`/reservations/${bookingId}`);
  return { success: d.type === "CHECKIN" ? "Bon woulé ! La location a démarré." : "Location terminée, merci !" };
}

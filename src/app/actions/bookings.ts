"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isVerified, requireUser } from "@/lib/auth";
import { toActionError, type ActionState } from "@/lib/errors";
import {
  cancelBooking,
  confirmHandover,
  confirmReturn,
  requestBooking,
  respondToBooking,
} from "@/lib/services/bookings";
import { getOrCreateConversation } from "@/lib/services/messages";
import { createReview } from "@/lib/services/reviews";

export async function requestBookingAction(listingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/annonces/${listingId}`);
  if (!isVerified(user)) return { error: "Confirmez d'abord votre adresse e-mail (lien envoyé à l'inscription)." };
  let bookingId: string;
  try {
    bookingId = await requestBooking(user.id, {
      listingId,
      startDate: String(formData.get("start") ?? ""),
      endDate: String(formData.get("end") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect(`/reservations/${bookingId}?envoyee=1`);
}

export async function contactOwnerAction(listingId: string): Promise<ActionState> {
  const user = await requireUser(`/annonces/${listingId}`);
  let conversationId: string;
  try {
    conversationId = await getOrCreateConversation(listingId, user.id);
  } catch (err) {
    return toActionError(err);
  }
  redirect(`/messages/${conversationId}`);
}

async function run(bookingId: string, fn: () => Promise<void>, message?: string): Promise<ActionState> {
  try {
    await fn();
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/reservations/${bookingId}`);
  revalidatePath("/reservations");
  return { ok: true, message };
}

export async function respondBookingAction(bookingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  const decision = formData.get("decision") === "accept" ? "accept" : "decline";
  return run(
    bookingId,
    () => respondToBooking(user.id, bookingId, decision, String(formData.get("reason") ?? "")),
    decision === "accept" ? "Réservation acceptée." : "Demande refusée.",
  );
}

export async function cancelBookingAction(bookingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  return run(bookingId, () => cancelBooking(user.id, bookingId, String(formData.get("reason") ?? "")), "Réservation annulée.");
}

export async function handoverAction(bookingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  const code = String(formData.get("code") ?? "");
  return run(bookingId, () => confirmHandover(user.id, bookingId, code), "Remise confirmée.");
}

export async function returnAction(bookingId: string): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  return run(bookingId, () => confirmReturn(user.id, bookingId), "Retour confirmé. Location terminée !");
}

export async function reviewAction(bookingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  return run(
    bookingId,
    () => createReview(user.id, bookingId, Number(formData.get("rating")), String(formData.get("comment") ?? "")),
    "Merci pour votre avis !",
  );
}

export async function payBookingAction(bookingId: string): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  let url: string;
  try {
    const { createCheckout } = await import("@/lib/services/payments");
    url = await createCheckout(user.id, bookingId);
  } catch (err) {
    return toActionError(err);
  }
  redirect(url);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isVerified, requireUser } from "@/lib/auth";
import { toActionError, type ActionState } from "@/lib/errors";
import {
  cancelBooking,
  confirmHandover,
  confirmReturn,
  needsAuthorization,
  requestBooking,
  respondToBooking,
} from "@/lib/services/bookings";
import { getOrCreateConversation } from "@/lib/services/messages";
import { addBookingPhotos, MAX_PHOTOS_PER_STAGE } from "@/lib/services/booking-photos";
import { readImageFiles } from "@/lib/services/images";
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
  // Paiement en ligne : la demande ne part qu'après l'empreinte bancaire.
  if (await needsAuthorization(bookingId)) {
    let url: string;
    try {
      const { createAuthorizationCheckout } = await import("@/lib/services/payments");
      url = await createAuthorizationCheckout(user.id, bookingId);
    } catch (err) {
      console.error(err);
      redirect(`/reservations/${bookingId}`);
    }
    redirect(url);
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
    const { createAuthorizationCheckout } = await import("@/lib/services/payments");
    url = await createAuthorizationCheckout(user.id, bookingId);
  } catch (err) {
    return toActionError(err);
  }
  redirect(url);
}

export async function addBookingPhotosAction(bookingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/reservations/${bookingId}`);
  const stage = formData.get("stage") === "return" ? "return" : "handover";
  let added = 0;
  try {
    const photos = await readImageFiles(formData.getAll("photos"), MAX_PHOTOS_PER_STAGE);
    added = await addBookingPhotos(user.id, bookingId, stage, photos, String(formData.get("note") ?? ""));
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/reservations/${bookingId}`);
  return { ok: true, message: `${added} photo${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""} à l'état des lieux.` };
}

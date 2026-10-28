"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, isVerified, requireUser } from "@/lib/auth";
import { MAX_PHOTOS } from "@/lib/config";
import { toActionError, type ActionState } from "@/lib/errors";
import { toggleFavorite } from "@/lib/services/favorites";
import { readImageFiles } from "@/lib/services/images";
import {
  addBlockedPeriod,
  createListing,
  parseListingForm,
  removeBlockedPeriod,
  setListingStatus,
  updateListing,
} from "@/lib/services/listings";
import { createReport } from "@/lib/services/moderation";

export async function createListingAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/annonces/nouvelle");
  if (!isVerified(user)) return { error: "Confirmez d'abord votre adresse e-mail (lien envoyé à l'inscription)." };
  const parsed = parseListingForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  let id: string;
  try {
    const photos = await readImageFiles(formData.getAll("photos"), MAX_PHOTOS);
    id = await createListing(user.id, parsed.data, photos);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/");
  redirect(`/annonces/${id}?publiee=1`);
}

export async function updateListingAction(listingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser(`/annonces/${listingId}/modifier`);
  const parsed = parseListingForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  try {
    const newPhotos = await readImageFiles(formData.getAll("photos"), MAX_PHOTOS);
    const removeImageIds = formData.getAll("removeImage").map(String);
    await updateListing(user.id, listingId, parsed.data, { newPhotos, removeImageIds });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/annonces/${listingId}`);
  redirect(`/annonces/${listingId}?modifiee=1`);
}

export async function setListingStatusAction(listingId: string, status: "active" | "paused" | "deleted"): Promise<ActionState> {
  const user = await requireUser();
  try {
    await setListingStatus(user.id, listingId, status);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/annonces/${listingId}`);
  revalidatePath("/compte");
  if (status === "deleted") redirect("/compte?supprimee=1");
  return { ok: true, message: status === "active" ? "Annonce réactivée." : "Annonce mise en pause." };
}

export async function addBlockedPeriodAction(listingId: string, _prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await addBlockedPeriod(user.id, listingId, String(formData.get("start") ?? ""), String(formData.get("end") ?? ""));
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/annonces/${listingId}/modifier`);
  return { ok: true, message: "Période bloquée." };
}

export async function removeBlockedPeriodAction(listingId: string, periodId: string): Promise<void> {
  const user = await requireUser();
  await removeBlockedPeriod(user.id, periodId);
  revalidatePath(`/annonces/${listingId}/modifier`);
}

export async function toggleFavoriteAction(listingId: string): Promise<{ favorite?: boolean; loginRequired?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { loginRequired: true };
  const favorite = await toggleFavorite(user.id, listingId);
  revalidatePath("/compte/favoris");
  return { favorite };
}

export async function reportAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Connectez-vous pour signaler un contenu." };
  try {
    await createReport(
      user.id,
      {
        listingId: (formData.get("listingId") as string) || undefined,
        userId: (formData.get("userId") as string) || undefined,
      },
      String(formData.get("reason") ?? ""),
      String(formData.get("details") ?? ""),
    );
  } catch (err) {
    return toActionError(err);
  }
  return { ok: true, message: "Merci, notre équipe va examiner ce signalement." };
}

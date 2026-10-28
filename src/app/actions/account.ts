"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { toActionError, type ActionState } from "@/lib/errors";
import { readImageFiles } from "@/lib/services/images";
import { markAllNotificationsRead } from "@/lib/services/notifications";
import { deleteAccount, profileSchema, updateProfile } from "@/lib/services/users";

export async function updateProfileAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/compte/profil");
  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    commune: formData.get("commune") ?? "",
    phone: formData.get("phone") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  try {
    const [avatar] = await readImageFiles(formData.getAll("avatar"), 1);
    await updateProfile(user.id, parsed.data, avatar);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil enregistré." };
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser("/compte/notifications");
  await markAllNotificationsRead(user.id);
  revalidatePath("/", "layout");
}

export async function deleteAccountAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/compte");
  if (formData.get("confirm") !== "SUPPRIMER") return { error: "Tapez SUPPRIMER pour confirmer." };
  try {
    await deleteAccount(user.id);
  } catch (err) {
    return toActionError(err);
  }
  await destroySession();
  redirect("/?compte-supprime=1");
}

export async function stripeOnboardingAction(): Promise<ActionState> {
  const user = await requireUser("/compte/paiements");
  let url: string;
  try {
    const { createOnboardingLink } = await import("@/lib/services/payments");
    url = await createOnboardingLink(user.id);
  } catch (err) {
    return toActionError(err);
  }
  redirect(url);
}

export async function stripeDashboardAction(): Promise<ActionState> {
  const user = await requireUser("/compte/paiements");
  let url: string;
  try {
    const { createDashboardLink } = await import("@/lib/services/payments");
    url = await createDashboardLink(user.id);
  } catch (err) {
    return toActionError(err);
  }
  redirect(url);
}

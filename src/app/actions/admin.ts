"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";
import { toActionError, type ActionState } from "@/lib/errors";
import { resolveReport, setListingHidden, setUserBanned } from "@/lib/services/moderation";

async function adminRun(fn: () => Promise<void>, message: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await fn();
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin");
  return { ok: true, message };
}

export async function resolveReportAction(reportId: string) {
  return adminRun(() => resolveReport(reportId), "Signalement traité.");
}

export async function hideListingAction(listingId: string, hidden: boolean) {
  return adminRun(() => setListingHidden(listingId, hidden), hidden ? "Annonce masquée." : "Annonce rétablie.");
}

export async function banUserAction(userId: string, banned: boolean) {
  return adminRun(() => setUserBanned(userId, banned), banned ? "Membre suspendu." : "Membre rétabli.");
}

export async function sendTestEmailAction(): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    return { ok: true, message: await sendTestEmail(admin.email) };
  } catch (err) {
    return { error: `Échec de l'envoi : ${err instanceof Error ? err.message : String(err)}` };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";
import { TERRITORY_IDS } from "@/lib/territories";
import type { FormState } from "@/components/FormMessage";
import { firstError, formObject } from "./_utils";

const profileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis.").max(60),
  lastName: z.string().min(1, "Le nom est requis.").max(60),
  phone: z.string().regex(/^\+?[0-9 .]{9,18}$/, "Numéro de téléphone invalide.").optional().or(z.literal("")),
  territory: z.enum(TERRITORY_IDS as [string, ...string[]]),
  bio: z.string().max(600).default(""),
  iban: z
    .string()
    .transform((s) => s.replace(/\s/g, "").toUpperCase())
    .refine((s) => s === "" || /^FR\d{2}[0-9A-Z]{23}$/.test(s), "IBAN invalide (format FR76…).")
    .default(""),
});

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  let avatarUrl: string | null = null;
  try {
    avatarUrl = await saveUpload(fd.get("avatar"));
  } catch (e) {
    return { error: (e as Error).message };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      iban: parsed.data.iban || null,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });
  revalidatePath("/compte");
  return { success: "Profil mis à jour." };
}

const licenseSchema = z.object({
  licenseNumber: z.string().min(5, "Numéro de permis invalide.").max(30),
  licenseIssuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'obtention invalide."),
});

export async function submitLicense(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = licenseSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  const issued = new Date(`${parsed.data.licenseIssuedAt}T12:00:00Z`);
  if (issued > new Date()) return { error: "La date d'obtention ne peut pas être dans le futur." };
  let fileUrl: string | null;
  try {
    fileUrl = await saveUpload(fd.get("licenseFile"), { allowPdf: true, private: true });
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!fileUrl && !user.licenseFileUrl) return { error: "Ajoutez une photo de votre permis (recto)." };
  await prisma.user.update({
    where: { id: user.id },
    data: {
      licenseNumber: parsed.data.licenseNumber.toUpperCase(),
      licenseIssuedAt: issued,
      licenseFileUrl: fileUrl ?? user.licenseFileUrl,
      licenseStatus: "PENDING",
    },
  });
  revalidatePath("/compte");
  return { success: "Permis envoyé ! Notre équipe le vérifie sous 24 h. Vous pouvez déjà envoyer des demandes de location." };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/compte/notifications");
}

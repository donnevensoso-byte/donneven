"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { WEATHER_LEVELS } from "@/lib/constants";
import { TERRITORY_IDS } from "@/lib/territories";
import type { FormState } from "@/components/FormMessage";
import { firstError, formObject } from "./_utils";

export async function reviewLicense(userId: string, approve: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { licenseStatus: approve ? "VERIFIED" : "REJECTED" } });
  await notify(
    userId,
    approve ? "Permis vérifié ✅" : "Permis refusé",
    approve ? "Votre permis de conduire a été vérifié. Vous pouvez louer en toute sérénité." : "Votre permis n'a pas pu être vérifié. Merci d'envoyer une photo lisible et en cours de validité.",
    "/compte",
  );
  revalidatePath("/admin");
}

const alertSchema = z.object({
  territory: z.enum(TERRITORY_IDS as [string, ...string[]]),
  level: z.enum(Object.keys(WEATHER_LEVELS) as [string, ...string[]]),
  title: z.string().min(3, "Indiquez un intitulé.").max(160),
});

export async function createWeatherAlert(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = alertSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  await prisma.weatherAlert.updateMany({ where: { territory: parsed.data.territory, active: true }, data: { active: false } });
  await prisma.weatherAlert.create({ data: parsed.data });
  revalidatePath("/", "layout");
  return { success: "Vigilance publiée." };
}

export async function endWeatherAlert(alertId: string) {
  await requireAdmin();
  await prisma.weatherAlert.update({ where: { id: alertId }, data: { active: false } });
  revalidatePath("/", "layout");
}

export async function setVehicleSuspended(vehicleId: string, suspended: boolean) {
  await requireAdmin();
  const v = await prisma.vehicle.update({ where: { id: vehicleId }, data: { status: suspended ? "SUSPENDED" : "ACTIVE" } });
  await notify(
    v.ownerId,
    suspended ? "Annonce suspendue" : "Annonce réactivée",
    suspended ? `Votre annonce ${v.make} ${v.model} a été suspendue par la modération. Contactez le support.` : `Votre annonce ${v.make} ${v.model} est de nouveau en ligne.`,
    `/proprietaire/vehicules/${v.id}`,
  );
  revalidatePath("/admin");
}

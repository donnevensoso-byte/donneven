"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORY_IDS, FEATURES, FUELS, TRANSMISSIONS } from "@/lib/constants";
import { blurPosition, findCommune, TERRITORY_IDS } from "@/lib/territories";
import { zonedDate } from "@/lib/dates";
import { saveUploads } from "@/lib/uploads";
import type { FormState } from "@/components/FormMessage";
import { checkbox, eurosField, firstError, formObject } from "./_utils";

const int = (label: string, min: number, max: number) =>
  z.coerce.number({ message: `${label} invalide.` }).int(`${label} invalide.`).min(min, `${label} : minimum ${min}.`).max(max, `${label} : maximum ${max}.`);

const vehicleSchema = z
  .object({
    make: z.string().min(1, "Indiquez la marque.").max(40),
    model: z.string().min(1, "Indiquez le modèle.").max(60),
    year: int("Année", 1990, new Date().getFullYear() + 1),
    category: z.enum(CATEGORY_IDS as [string, ...string[]], { message: "Catégorie invalide." }),
    transmission: z.enum(Object.keys(TRANSMISSIONS) as [string, ...string[]]),
    fuel: z.enum(Object.keys(FUELS) as [string, ...string[]]),
    seats: int("Nombre de places", 1, 9),
    doors: int("Nombre de portes", 0, 5),
    airConditioning: checkbox,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#14a394"),
    description: z.string().max(2000).default(""),
    rules: z.string().max(1000).default(""),
    territory: z.enum(TERRITORY_IDS as [string, ...string[]]),
    commune: z.string().min(1, "Choisissez une commune."),
    address: z.string().max(200).default(""),
    lat: z.string().optional(),
    lng: z.string().optional(),
    pricePerDay: eurosField("Prix par jour", 5),
    weeklyDiscountPct: int("Remise semaine", 0, 60),
    monthlyDiscountPct: int("Remise mois", 0, 70),
    depositAmount: eurosField("Caution", 0),
    kmIncludedPerDay: int("Kilomètres inclus", 0, 2000),
    extraKmPrice: eurosField("Prix du km supplémentaire", 0),
    minDays: int("Durée minimum", 1, 30),
    maxDays: int("Durée maximum", 1, 365),
    instantBooking: checkbox,
    airportDelivery: checkbox,
    airportFee: eurosField("Frais de livraison aéroport", 0),
    portDelivery: checkbox,
    portFee: eurosField("Frais de livraison port", 0),
    ferryAllowed: checkbox,
    trackAllowed: checkbox,
  })
  .refine((d) => d.maxDays >= d.minDays, { message: "La durée maximum doit être supérieure à la durée minimum." });

function parseVehicle(fd: FormData) {
  const raw = formObject(fd);
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, state: firstError(parsed.error) } as const;
  const d = parsed.data;
  const commune = findCommune(d.territory, d.commune);
  if (!commune) return { ok: false, state: { error: "Cette commune n'appartient pas au territoire choisi." } as FormState } as const;
  const features = fd
    .getAll("features")
    .filter((f): f is string => typeof f === "string" && (FEATURES as readonly string[]).includes(f));
  // position choisie sur la carte, sinon centre de la commune
  const { lat, lng, ...rest } = d;
  const pin = lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? [Number(lat), Number(lng)] : null;
  return {
    ok: true,
    data: {
      ...rest,
      features: features.join(","),
      lat: pin ? pin[0] : commune.lat,
      lng: pin ? pin[1] : commune.lng,
    },
  } as const;
}

export async function createVehicle(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/proprietaire/vehicules/nouveau");
  const result = parseVehicle(fd);
  if (!result.ok) return result.state;

  let photoUrls: string[];
  try {
    photoUrls = await saveUploads(fd.getAll("photos"));
  } catch (e) {
    return { error: (e as Error).message };
  }

  const data = { ...result.data };
  if (!(fd.get("lat") && fd.get("lng"))) {
    [data.lat, data.lng] = blurPosition(data.lat, data.lng, `${user.id}${data.make}${data.model}`);
  }
  const vehicle = await prisma.vehicle.create({
    data: {
      ...data,
      ownerId: user.id,
      photos: { create: photoUrls.map((url, position) => ({ url, position })) },
    },
  });
  revalidatePath("/proprietaire");
  redirect(`/proprietaire/vehicules/${vehicle.id}?cree=1`);
}

async function ownedVehicle(vehicleId: string) {
  const user = await requireUser();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || (vehicle.ownerId !== user.id && user.role !== "ADMIN")) throw new Error("Véhicule introuvable.");
  return { user, vehicle };
}

export async function updateVehicle(vehicleId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { vehicle } = await ownedVehicle(vehicleId);
  const result = parseVehicle(fd);
  if (!result.ok) return result.state;

  let photoUrls: string[];
  try {
    photoUrls = await saveUploads(fd.getAll("photos"));
  } catch (e) {
    return { error: (e as Error).message };
  }
  const count = await prisma.vehiclePhoto.count({ where: { vehicleId } });
  const data = { ...result.data };
  // si l'emplacement n'a pas été modifié sur la carte et que la commune est inchangée, on garde la position actuelle
  if (!(fd.get("lat") && fd.get("lng")) && data.commune === vehicle.commune) {
    data.lat = vehicle.lat;
    data.lng = vehicle.lng;
  }
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...data,
      photos: { create: photoUrls.map((url, i) => ({ url, position: count + i })) },
    },
  });
  revalidatePath(`/vehicules/${vehicleId}`);
  revalidatePath(`/proprietaire/vehicules/${vehicleId}`);
  return { success: "Annonce mise à jour." };
}

export async function setVehicleStatus(vehicleId: string, status: "ACTIVE" | "PAUSED") {
  const { vehicle } = await ownedVehicle(vehicleId);
  if (vehicle.status === "SUSPENDED") return;
  await prisma.vehicle.update({ where: { id: vehicleId }, data: { status } });
  revalidatePath(`/proprietaire/vehicules/${vehicleId}`);
  revalidatePath("/proprietaire");
}

export async function deletePhoto(vehicleId: string, photoId: string) {
  await ownedVehicle(vehicleId);
  await prisma.vehiclePhoto.deleteMany({ where: { id: photoId, vehicleId } });
  revalidatePath(`/proprietaire/vehicules/${vehicleId}`);
}

export async function makeCoverPhoto(vehicleId: string, photoId: string) {
  await ownedVehicle(vehicleId);
  const photos = await prisma.vehiclePhoto.findMany({ where: { vehicleId }, orderBy: { position: "asc" } });
  const ordered = [...photos.filter((p) => p.id === photoId), ...photos.filter((p) => p.id !== photoId)];
  await prisma.$transaction(ordered.map((p, position) => prisma.vehiclePhoto.update({ where: { id: p.id }, data: { position } })));
  revalidatePath(`/proprietaire/vehicules/${vehicleId}`);
}

const blockSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
  reason: z.string().max(100).default(""),
});

export async function addBlock(vehicleId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { vehicle } = await ownedVehicle(vehicleId);
  const parsed = blockSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  const startAt = zonedDate(vehicle.territory, parsed.data.start, "00:00")!;
  const endAt = zonedDate(vehicle.territory, parsed.data.end, "23:59")!;
  if (endAt <= startAt) return { error: "La date de fin doit être après la date de début." };
  await prisma.vehicleBlock.create({ data: { vehicleId, startAt, endAt, reason: parsed.data.reason } });
  revalidatePath(`/proprietaire/vehicules/${vehicleId}`);
  return { success: "Période bloquée." };
}

export async function removeBlock(vehicleId: string, blockId: string) {
  await ownedVehicle(vehicleId);
  await prisma.vehicleBlock.deleteMany({ where: { id: blockId, vehicleId } });
  revalidatePath(`/proprietaire/vehicules/${vehicleId}`);
}

export async function toggleFavorite(vehicleId: string): Promise<boolean> {
  const user = await requireUser();
  const key = { userId_vehicleId: { userId: user.id, vehicleId } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, vehicleId } });
  }
  revalidatePath("/compte/favoris");
  return !existing;
}

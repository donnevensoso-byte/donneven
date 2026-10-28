"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadBookingFor } from "@/lib/bookings";
import { notify } from "@/lib/notifications";
import type { FormState } from "@/components/FormMessage";
import { firstError, formObject } from "./_utils";

const schema = z.object({
  rating: z.coerce.number().int().min(1, "Choisissez une note.").max(5),
  comment: z.string().trim().min(10, "Votre avis doit faire au moins 10 caractères.").max(1500),
});

export async function submitReview(bookingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const ctx = await loadBookingFor(bookingId, user.id);
  if (!ctx || ctx.role === "ADMIN") return { error: "Réservation introuvable." };
  if (ctx.booking.status !== "COMPLETED") return { error: "Vous pourrez laisser un avis une fois la location terminée." };
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);

  const existing = await prisma.review.findUnique({ where: { bookingId_authorId: { bookingId, authorId: user.id } } });
  if (existing) return { error: "Vous avez déjà laissé un avis pour cette location." };

  const renterToOwner = ctx.role === "RENTER";
  const targetUserId = renterToOwner ? ctx.booking.vehicle.ownerId : ctx.booking.renterId;
  await prisma.review.create({
    data: {
      bookingId,
      vehicleId: ctx.booking.vehicleId,
      authorId: user.id,
      targetUserId,
      direction: renterToOwner ? "RENTER_TO_OWNER" : "OWNER_TO_RENTER",
      ...parsed.data,
    },
  });
  await notify(targetUserId, "Nouvel avis reçu", `${user.firstName} vous a laissé un avis ${"★".repeat(parsed.data.rating)}.`, `/utilisateurs/${targetUserId}`);
  revalidatePath(`/reservations/${bookingId}`);
  revalidatePath(`/vehicules/${ctx.booking.vehicleId}`);
  return { success: "Mèsi ! Votre avis a été publié." };
}

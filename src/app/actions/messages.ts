"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadBookingFor } from "@/lib/bookings";
import { notify } from "@/lib/notifications";
import type { FormState } from "@/components/FormMessage";

const schema = z.string().trim().min(1, "Écrivez un message.").max(2000, "Message trop long.");

export async function sendMessage(bookingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const ctx = await loadBookingFor(bookingId, user.id);
  if (!ctx || ctx.role === "ADMIN") return { error: "Conversation introuvable." };
  const parsed = schema.safeParse(fd.get("body"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.message.create({ data: { bookingId, senderId: user.id, body: parsed.data } });
  const other = ctx.role === "RENTER" ? ctx.booking.vehicle.ownerId : ctx.booking.renterId;
  const recent = await prisma.notification.findFirst({
    where: { userId: other, link: `/reservations/${bookingId}#messages`, readAt: null },
  });
  if (!recent) await notify(other, `Nouveau message de ${user.firstName}`, parsed.data.slice(0, 120), `/reservations/${bookingId}#messages`);
  revalidatePath(`/reservations/${bookingId}`);
  revalidatePath("/messages");
  return { success: "Envoyé" };
}

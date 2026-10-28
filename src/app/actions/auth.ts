"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";
import { ageAt } from "@/lib/pricing";
import { TERRITORY_IDS } from "@/lib/territories";
import type { FormState } from "@/components/FormMessage";
import { firstError, formObject, safeNext } from "./_utils";

const registerSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis.").max(60),
  lastName: z.string().min(1, "Le nom est requis.").max(60),
  email: z.email("Adresse e-mail invalide.").transform((s) => s.toLowerCase()),
  phone: z.string().regex(/^\+?[0-9 .]{9,18}$/, "Numéro de téléphone invalide.").optional().or(z.literal("")),
  territory: z.enum(TERRITORY_IDS as [string, ...string[]], { message: "Territoire invalide." }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  cgu: z.literal("on", { message: "Vous devez accepter les conditions générales." }),
  suite: z.string().optional(),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;

  const birthDate = new Date(`${d.birthDate}T12:00:00Z`);
  if (ageAt(birthDate) < 18) return { error: "Vous devez être majeur pour créer un compte." };

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { error: "Un compte existe déjà avec cette adresse e-mail." };

  const user = await prisma.user.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone || null,
      territory: d.territory,
      birthDate,
      passwordHash: await bcrypt.hash(d.password, 10),
    },
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Byenvini sur Woulé !",
      body: "Ajoutez votre permis de conduire dans votre profil pour pouvoir réserver un véhicule.",
      link: "/compte",
    },
  });
  await startSession(user.id);
  redirect(safeNext(d.suite, "/compte?bienvenue=1"));
}

const loginSchema = z.object({
  email: z.email("Adresse e-mail invalide.").transform((s) => s.toLowerCase()),
  password: z.string().min(1, "Mot de passe requis."),
  suite: z.string().optional(),
});

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formObject(fd));
  if (!parsed.success) return firstError(parsed.error);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  await startSession(user.id);
  redirect(safeNext(parsed.data.suite, "/"));
}

export async function logout() {
  await endSession();
  redirect("/");
}

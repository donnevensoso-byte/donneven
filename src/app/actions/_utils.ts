import { z } from "zod";
import type { FormState } from "@/components/FormMessage";

export function firstError(error: z.ZodError): FormState {
  return { error: error.issues[0]?.message ?? "Formulaire invalide." };
}

export function formObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v.trim();
  return out;
}

/** Montant saisi en euros (« 45 » ou « 45,50 ») → centimes. */
export const eurosField = (label: string, min = 0) =>
  z
    .string()
    .transform((s) => Math.round(Number(s.replace(",", ".")) * 100))
    .refine((n) => Number.isFinite(n) && n >= min * 100, `${label} invalide.`);

export const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

/** Redirection interne uniquement (évite les redirections ouvertes). */
export function safeNext(next: string | undefined | null, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

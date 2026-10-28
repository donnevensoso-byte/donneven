"use client";

import { useActionState } from "react";
import type { FormState } from "../FormMessage";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function BlockForm({ action, today }: { action: (s: FormState, fd: FormData) => Promise<FormState>; today: string }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
      <label><span className="label">Du</span><input type="date" name="start" min={today} required className="input" /></label>
      <label><span className="label">Au</span><input type="date" name="end" min={today} required className="input" /></label>
      <label><span className="label">Motif (privé)</span><input name="reason" className="input" placeholder="Usage perso, entretien, carnaval…" /></label>
      <SubmitButton className="btn-outline">Bloquer</SubmitButton>
      <div className="sm:col-span-4"><FormMessage state={state} /></div>
    </form>
  );
}

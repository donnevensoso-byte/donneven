"use client";

import { useTransition } from "react";
import { addBlockedPeriodAction, removeBlockedPeriodAction } from "@/app/actions/listings";
import { formatDate } from "@/lib/dates";
import { ActionForm, FormMessage, SubmitButton, useActionForm } from "./form";

type Period = { id?: string; start: string; end: string; kind: "booked" | "blocked" };

export function AvailabilityManager({ listingId, periods, today }: { listingId: string; periods: Period[]; today: string }) {
  const form = useActionForm(addBlockedPeriodAction.bind(null, listingId));
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-4">
      {periods.length === 0 ? (
        <p className="text-sm text-muted">Aucune indisponibilité à venir : votre matériel peut être réservé à toutes les dates.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {periods.map((p) => (
            <li key={`${p.kind}-${p.id ?? p.start}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span>
                {p.start === p.end ? formatDate(p.start) : `${formatDate(p.start)} → ${formatDate(p.end)}`}
                <span className="ml-2 text-muted">{p.kind === "booked" ? "· réservé" : "· bloqué par vous"}</span>
              </span>
              {p.kind === "blocked" && p.id && (
                <button
                  type="button"
                  className="text-xs font-semibold text-flame-500 hover:underline"
                  disabled={pending}
                  onClick={() => startTransition(() => removeBlockedPeriodAction(listingId, p.id!))}
                >
                  Débloquer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ActionForm form={form} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="label" htmlFor="block-start">Bloquer du</label>
          <input className="input" type="date" id="block-start" name="start" min={today} required />
        </div>
        <div>
          <label className="label" htmlFor="block-end">au (inclus)</label>
          <input className="input" type="date" id="block-end" name="end" min={today} required />
        </div>
        <SubmitButton className="btn-secondary">Bloquer ces dates</SubmitButton>
        <div className="sm:col-span-3">
          <FormMessage state={form.state} />
        </div>
      </ActionForm>
    </div>
  );
}

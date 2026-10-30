"use client";

import { useState } from "react";
import { openDisputeAction } from "@/app/actions/bookings";
import { DISPUTE_REASONS } from "@/lib/services/moderation-reasons";
import { ActionForm, FormMessage, SubmitButton, useActionForm } from "./form";

/** Déclarer un litige à l'équipe depuis la réservation (replié par défaut). */
export function DisputeForm({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const form = useActionForm((prev, formData) => openDisputeAction(bookingId, prev, formData));
  if (!open) {
    return (
      <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(true)}>
        ⚠️ Signaler un problème sur cette location
      </button>
    );
  }
  return (
    <ActionForm form={form} className="space-y-3 rounded-xl border border-line p-4">
      <FormMessage state={form.state} />
      {!form.state?.ok && (
        <>
          <p className="text-sm text-muted">
            Essayez d&apos;abord de régler la situation par message. Sinon, décrivez le problème : l&apos;équipe Zouti s&apos;appuie sur
            la conversation, les photos d&apos;état des lieux et le contrat.
          </p>
          <div>
            <label className="label" htmlFor="dispute-reason">Motif</label>
            <select className="input" id="dispute-reason" name="reason" defaultValue="" required>
              <option value="" disabled>Choisir…</option>
              {DISPUTE_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dispute-details">Que s&apos;est-il passé ?</label>
            <textarea className="input min-h-24" id="dispute-details" name="details" maxLength={2000} />
          </div>
          <div className="flex flex-wrap gap-2">
            <SubmitButton className="btn-danger">Envoyer à l&apos;équipe Zouti</SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Retour</button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

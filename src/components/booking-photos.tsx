"use client";

import { useState } from "react";
import { addBookingPhotosAction } from "@/app/actions/bookings";
import { ActionForm, FormMessage, SubmitButton, useActionForm } from "./form";
import { PhotoInput } from "./photo-input";

type Stage = "handover" | "return";
const LABELS: Record<Stage, string> = { handover: "À la remise", return: "Au retour" };

/** Formulaire d'ajout de photos à l'état des lieux d'une réservation. */
export function BookingPhotosForm({ bookingId, stages, max }: { bookingId: string; stages: Stage[]; max: number }) {
  const [key, setKey] = useState(0);
  const form = useActionForm(async (prev, formData) => {
    const result = await addBookingPhotosAction(bookingId, prev, formData);
    // Vide le sélecteur après un envoi réussi pour pouvoir en ajouter d'autres.
    if (result.ok) setKey((k) => k + 1);
    return result;
  });
  return (
    <ActionForm form={form} className="space-y-3 rounded-xl border border-line p-4">
      {stages.length > 1 ? (
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="label">Étape</legend>
          {stages.map((stage, i) => (
            <label key={stage} className="flex items-center gap-2">
              <input type="radio" name="stage" value={stage} defaultChecked={i === stages.length - 1} className="size-4 accent-brand-600" />
              {LABELS[stage]}
            </label>
          ))}
        </fieldset>
      ) : (
        <input type="hidden" name="stage" value={stages[0]} />
      )}
      <PhotoInput
        key={key}
        max={max}
        cover={false}
        hint={`Jusqu'à ${max} photos par personne et par étape : vue d'ensemble, défauts, niveau de carburant, accessoires. Elles sont datées automatiquement.`}
      />
      <div>
        <label className="label" htmlFor="photo-note">Remarque <span className="font-normal text-muted">(facultatif)</span></label>
        <input className="input" id="photo-note" name="note" maxLength={300} placeholder="Ex. rayure existante sur le carter" />
      </div>
      <FormMessage state={form.state} />
      <SubmitButton className="btn-secondary" pendingLabel="Envoi des photos…">📸 Ajouter à l'état des lieux</SubmitButton>
    </ActionForm>
  );
}

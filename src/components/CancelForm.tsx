"use client";

import { useActionState, useState } from "react";
import { cancelBooking } from "@/app/actions/bookings";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function CancelForm({ bookingId, policy }: { bookingId: string; policy: string }) {
  const [state, action] = useActionState(cancelBooking.bind(null, bookingId), null);
  const [open, setOpen] = useState(false);
  if (state?.success) return <FormMessage state={state} />;
  if (!open)
    return (
      <button type="button" className="btn-danger" onClick={() => setOpen(true)}>
        Annuler la réservation
      </button>
    );
  return (
    <form action={action} className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
      <p className="text-sm text-slate-700">{policy}</p>
      <textarea name="reason" rows={2} className="input" placeholder="Motif de l'annulation (facultatif)" />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-danger">Confirmer l&apos;annulation</SubmitButton>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Retour</button>
      </div>
    </form>
  );
}

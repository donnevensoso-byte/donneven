"use client";

import { useState, useTransition } from "react";
import {
  cancelBookingAction,
  handoverAction,
  payBookingAction,
  respondBookingAction,
  returnAction,
  reviewAction,
} from "@/app/actions/bookings";
import type { ActionState } from "@/lib/errors";
import { ActionForm, FormMessage, SubmitButton, useActionForm } from "./form";
import { Alert } from "./ui";

export function RespondForm({ bookingId }: { bookingId: string }) {
  const form = useActionForm(respondBookingAction.bind(null, bookingId));
  const [declining, setDeclining] = useState(false);
  if (form.state?.ok) return <Alert tone="success">{form.state.message}</Alert>;
  return (
    <ActionForm form={form} className="space-y-3">
      <FormMessage state={form.state} />
      {declining ? (
        <>
          <div>
            <label className="label" htmlFor="reason">Motif du refus <span className="font-normal text-muted">(facultatif, visible par le locataire)</span></label>
            <textarea className="input min-h-16" id="reason" name="reason" maxLength={500} placeholder="Ex. Je l'utilise moi-même ce week-end, désolé !" />
          </div>
          <div className="flex flex-wrap gap-2">
            <SubmitButton className="btn-danger" name="decision" value="decline">Confirmer le refus</SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setDeclining(false)}>Retour</button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <SubmitButton className="btn-primary flex-1 py-3" name="decision" value="accept" pendingLabel="Validation…">
            ✅ Accepter la demande
          </SubmitButton>
          <button type="button" className="btn-secondary flex-1 py-3" onClick={() => setDeclining(true)}>
            Refuser
          </button>
        </div>
      )}
    </ActionForm>
  );
}

export function CancelForm({ bookingId, label = "Annuler la réservation" }: { bookingId: string; label?: string }) {
  const form = useActionForm(cancelBookingAction.bind(null, bookingId));
  const [open, setOpen] = useState(false);
  if (form.state?.ok) return <Alert tone="success">{form.state.message}</Alert>;
  if (!open) {
    return (
      <button type="button" className="btn-ghost text-flame-500" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }
  return (
    <ActionForm form={form} className="space-y-3 rounded-xl border border-line p-4">
      <FormMessage state={form.state} />
      <div>
        <label className="label" htmlFor="cancel-reason">Pourquoi annulez-vous ?</label>
        <textarea className="input min-h-16" id="cancel-reason" name="reason" maxLength={500} />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton className="btn-danger">Confirmer l&apos;annulation</SubmitButton>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Retour</button>
      </div>
    </ActionForm>
  );
}

function OneClick({
  action,
  label,
  pendingLabel,
  className = "btn-primary w-full py-3",
  confirmText,
}: {
  action: () => Promise<ActionState>;
  label: string;
  pendingLabel: string;
  className?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>();
  return (
    <div className="space-y-2">
      <FormMessage state={state} />
      {!state?.ok && (
        <button
          type="button"
          className={className}
          disabled={pending}
          onClick={() => {
            if (confirmText && !confirm(confirmText)) return;
            startTransition(async () => setState(await action()));
          }}
        >
          {pending ? pendingLabel : label}
        </button>
      )}
    </div>
  );
}

/** Le propriétaire saisit le code que le locataire lui montre au moment de la remise. */
export function HandoverForm({ bookingId, onsite }: { bookingId: string; onsite: boolean }) {
  const form = useActionForm(handoverAction.bind(null, bookingId));
  if (form.state?.ok) return <Alert tone="success">{form.state.message}</Alert>;
  return (
    <ActionForm form={form} className="space-y-3 rounded-xl border border-line p-4">
      <div>
        <label className="label" htmlFor="handover-code">Code de remise du locataire</label>
        <input
          className="input max-w-40 text-center text-2xl font-bold tracking-[0.4em]"
          id="handover-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{4}"
          maxLength={4}
          placeholder="0000"
          aria-invalid={form.state?.error ? true : undefined}
          aria-describedby="handover-hint"
        />
        <p className="hint" id="handover-hint">
          Le locataire le trouve sur sa réservation. Saisissez-le une fois le matériel vérifié et photographié ensemble
          {onsite ? ", la location et la caution réglées" : ""}.
        </p>
      </div>
      <FormMessage state={form.state} />
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Vérification…">🤝 Confirmer la remise</SubmitButton>
    </ActionForm>
  );
}

export function ReturnButton({ bookingId }: { bookingId: string }) {
  return (
    <OneClick
      action={() => returnAction(bookingId)}
      label="📦 Le matériel m'a été rendu"
      pendingLabel="Enregistrement…"
      confirmText="Confirmez-vous que le matériel vous a été rendu ? Pensez à restituer la caution s'il est en bon état."
    />
  );
}

export function PayButton({ bookingId, amount }: { bookingId: string; amount: string }) {
  return <OneClick action={() => payBookingAction(bookingId)} label={`💳 Valider l'empreinte de ${amount}`} pendingLabel="Redirection vers le paiement sécurisé…" />;
}

export function ReviewForm({ bookingId, targetName }: { bookingId: string; targetName: string }) {
  const form = useActionForm(reviewAction.bind(null, bookingId));
  const [rating, setRating] = useState(0);
  if (form.state?.ok) return <Alert tone="success">{form.state.message}</Alert>;
  return (
    <ActionForm form={form} className="space-y-3">
      <FormMessage state={form.state} />
      <fieldset>
        <legend className="label">Votre note pour {targetName}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer text-3xl leading-none" title={`${n} étoile${n > 1 ? "s" : ""}`}>
              <input type="radio" name="rating" value={n} className="sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <span className={n <= rating ? "text-sun-400" : "text-line"} aria-hidden>★</span>
              <span className="sr-only">{n} étoile{n > 1 ? "s" : ""}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="comment">Votre avis</label>
        <textarea className="input min-h-24" id="comment" name="comment" maxLength={1000} placeholder="Ponctualité, état du matériel, communication…" />
      </div>
      <SubmitButton>Publier mon avis</SubmitButton>
    </ActionForm>
  );
}

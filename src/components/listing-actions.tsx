"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { contactOwnerAction } from "@/app/actions/bookings";
import { reportAction, setListingStatusAction, toggleFavoriteAction } from "@/app/actions/listings";
import { REPORT_REASONS } from "@/lib/services/moderation-reasons";
import { ActionForm, FormMessage, SubmitButton, useActionForm } from "./form";

export function FavoriteButton({ listingId, initial }: { listingId: string; initial: boolean }) {
  const [favorite, setFavorite] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-secondary"
      aria-pressed={favorite}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavoriteAction(listingId);
          if (res.loginRequired) router.push(`/connexion?next=/annonces/${listingId}`);
          else setFavorite(Boolean(res.favorite));
        })
      }
    >
      <span aria-hidden>{favorite ? "❤️" : "🤍"}</span>
      {favorite ? "Enregistré" : "Enregistrer"}
    </button>
  );
}

export function ContactButton({ listingId, className = "btn-secondary w-full" }: { listingId: string; className?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await contactOwnerAction(listingId);
            if (res?.error) setError(res.error);
          })
        }
      >
        💬 {pending ? "Ouverture…" : "Poser une question"}
      </button>
      {error && <p className="field-error">{error}</p>}
    </>
  );
}

export function OwnerListingControls({ listingId, status }: { listingId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const change = (next: "active" | "paused" | "deleted") =>
    startTransition(async () => {
      if (next === "deleted" && !confirm("Supprimer définitivement cette annonce ?")) return;
      const res = await setListingStatusAction(listingId, next);
      setMessage(res.error ?? res.message);
    });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <a href={`/annonces/${listingId}/modifier`} className="btn-primary">✏️ Modifier</a>
        {status === "active" && (
          <button type="button" className="btn-secondary" disabled={pending} onClick={() => change("paused")}>⏸️ Mettre en pause</button>
        )}
        {status === "paused" && (
          <button type="button" className="btn-secondary" disabled={pending} onClick={() => change("active")}>▶️ Réactiver</button>
        )}
        <button type="button" className="btn-danger" disabled={pending} onClick={() => change("deleted")}>Supprimer</button>
      </div>
      {message && <p className="text-sm text-muted" role="status">{message}</p>}
    </div>
  );
}

export function ReportButton({ listingId, userId }: { listingId?: string; userId?: string }) {
  const [open, setOpen] = useState(false);
  const form = useActionForm(reportAction);
  if (!open) {
    return (
      <button type="button" className="text-xs text-muted underline hover:text-ink" onClick={() => setOpen(true)}>
        🚩 Signaler {listingId ? "cette annonce" : "ce membre"}
      </button>
    );
  }
  return (
    <ActionForm form={form} className="card mt-2 space-y-3 p-4">
      <input type="hidden" name="listingId" value={listingId ?? ""} />
      <input type="hidden" name="userId" value={userId ?? ""} />
      <FormMessage state={form.state} />
      {!form.state?.ok && (
        <>
          <div>
            <label className="label" htmlFor="reason">Motif</label>
            <select className="input" id="reason" name="reason" defaultValue="">
              <option value="" disabled>Choisir…</option>
              {REPORT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="details">Précisions</label>
            <textarea className="input min-h-16" id="details" name="details" maxLength={1000} />
          </div>
          <div className="flex gap-2">
            <SubmitButton className="btn-danger">Envoyer le signalement</SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

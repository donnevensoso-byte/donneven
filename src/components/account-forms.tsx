"use client";

import { useState, useTransition } from "react";
import { changePasswordAction, resendVerificationAction } from "@/app/actions/auth";
import { deleteAccountAction, stripeDashboardAction, stripeOnboardingAction, updateProfileAction } from "@/app/actions/account";
import type { ActionState } from "@/lib/errors";
import { ActionForm, FieldError, FormMessage, SubmitButton, useActionForm } from "./form";
import { Avatar } from "./ui";

type Profile = { name: string; commune: string; phone: string | null; bio: string | null; avatarImageId: string | null };

export function ProfileForm({ profile, communeOptions }: { profile: Profile; communeOptions: React.ReactNode }) {
  const form = useActionForm(updateProfileAction);
  const { state } = form;
  const [preview, setPreview] = useState<string>();
  return (
    <ActionForm form={form} className="card space-y-4 p-5 sm:p-6">
      <FormMessage state={state} />
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <Avatar name={profile.name} imageId={profile.avatarImageId} size={80} />
        )}
        <label className="btn-secondary cursor-pointer">
          📷 Changer la photo
          <input
            type="file"
            name="avatar"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : undefined);
            }}
          />
        </label>
      </div>
      <div>
        <label className="label" htmlFor="name">Prénom et nom</label>
        <input className="input" id="name" name="name" defaultValue={profile.name} maxLength={60} />
        <FieldError state={state} name="name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="commune">Commune</label>
          <select className="input" id="commune" name="commune" defaultValue={profile.commune}>
            {communeOptions}
          </select>
          <FieldError state={state} name="commune" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Téléphone <span className="font-normal text-muted">(facultatif)</span></label>
          <input className="input" id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} placeholder="0694 12 34 56" />
          <p className="hint">Partagé uniquement avec vos locataires/propriétaires une fois une réservation confirmée.</p>
          <FieldError state={state} name="phone" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="bio">À propos de vous</label>
        <textarea className="input min-h-24" id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} placeholder="Bricoleur du dimanche à Rémire, je prête volontiers mon matériel…" />
        <FieldError state={state} name="bio" />
      </div>
      <SubmitButton>Enregistrer</SubmitButton>
    </ActionForm>
  );
}

export function PasswordForm() {
  const form = useActionForm(changePasswordAction);
  return (
    <ActionForm form={form} className="space-y-3">
      <FormMessage state={form.state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current">Mot de passe actuel</label>
          <input className="input" id="current" name="current" type="password" autoComplete="current-password" />
          <FieldError state={form.state} name="current" />
        </div>
        <div>
          <label className="label" htmlFor="new-password">Nouveau mot de passe</label>
          <input className="input" id="new-password" name="password" type="password" autoComplete="new-password" />
          <FieldError state={form.state} name="password" />
        </div>
      </div>
      <SubmitButton className="btn-secondary">Changer le mot de passe</SubmitButton>
    </ActionForm>
  );
}

export function DeleteAccountForm() {
  const form = useActionForm(deleteAccountAction);
  return (
    <ActionForm form={form} className="space-y-3">
      <FormMessage state={form.state} />
      <p className="text-sm text-muted">
        Vos annonces, messages et avis seront supprimés définitivement. Tapez <strong>SUPPRIMER</strong> pour confirmer.
      </p>
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-48" name="confirm" aria-label="Confirmation" autoComplete="off" />
        <SubmitButton className="btn-danger">Supprimer mon compte</SubmitButton>
      </div>
    </ActionForm>
  );
}

function useOneShot(action: () => Promise<ActionState>) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>();
  return { pending, state, run: () => startTransition(async () => setState(await action())) };
}

export function ResendVerificationButton() {
  const { pending, state, run } = useOneShot(resendVerificationAction);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" className="font-semibold underline" disabled={pending} onClick={run}>
        Renvoyer l&apos;e-mail
      </button>
      {state && <span>{state.error ?? state.message}</span>}
    </span>
  );
}

export function StripeButtons({ onboarded, hasAccount }: { onboarded: boolean; hasAccount: boolean }) {
  const onboarding = useOneShot(stripeOnboardingAction);
  const dashboard = useOneShot(stripeDashboardAction);
  const error = onboarding.state?.error ?? dashboard.state?.error;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!onboarded && (
          <button type="button" className="btn-primary" disabled={onboarding.pending} onClick={onboarding.run}>
            {onboarding.pending ? "Redirection…" : hasAccount ? "Terminer mon inscription" : "Activer les paiements en ligne"}
          </button>
        )}
        {hasAccount && onboarded && (
          <button type="button" className="btn-secondary" disabled={dashboard.pending} onClick={dashboard.run}>
            Voir mes versements
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

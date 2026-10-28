"use client";

import Link from "next/link";
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction } from "@/app/actions/auth";
import { ActionForm, FieldError, FormMessage, SubmitButton, useActionForm } from "./form";

export function LoginForm({ next }: { next?: string }) {
  const form = useActionForm(loginAction);
  const { state } = form;
  return (
    <ActionForm form={form} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">Adresse e-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">Mot de passe</label>
          <Link href="/mot-de-passe-oublie" className="mb-1.5 text-xs font-medium text-brand-600 hover:underline">Mot de passe oublié ?</Link>
        </div>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Connexion…">Se connecter</SubmitButton>
    </ActionForm>
  );
}

export function SignupForm({ next, communeOptions }: { next?: string; communeOptions: React.ReactNode }) {
  const form = useActionForm(signupAction);
  const { state } = form;
  return (
    <ActionForm form={form} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="name">Prénom et nom</label>
        <input className="input" id="name" name="name" autoComplete="name" required aria-describedby="name-hint" />
        <p className="hint" id="name-hint">Seuls votre prénom et l&apos;initiale de votre nom sont affichés publiquement.</p>
        <FieldError state={state} name="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">Adresse e-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="hint">8 caractères minimum.</p>
        <FieldError state={state} name="password" />
      </div>
      <div>
        <label className="label" htmlFor="commune">Votre commune</label>
        <select className="input" id="commune" name="commune" required defaultValue="">
          <option value="" disabled>Choisir…</option>
          {communeOptions}
        </select>
        <FieldError state={state} name="commune" />
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-brand-600" required />
          <span>
            J&apos;accepte les <Link href="/cgu" target="_blank" className="font-medium text-brand-600 underline">conditions d&apos;utilisation</Link> et la{" "}
            <Link href="/confidentialite" target="_blank" className="font-medium text-brand-600 underline">politique de confidentialité</Link>.
          </span>
        </label>
        <FieldError state={state} name="terms" />
      </div>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  const form = useActionForm(forgotPasswordAction);
  const { state } = form;
  return (
    <ActionForm form={form} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">Adresse e-mail du compte</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <SubmitButton className="btn-primary w-full py-3">Recevoir un lien</SubmitButton>
    </ActionForm>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const form = useActionForm(resetPasswordAction);
  const { state } = form;
  return (
    <ActionForm form={form} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">Nouveau mot de passe</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirmez le mot de passe</label>
        <input className="input" id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError state={state} name="confirm" />
      </div>
      <SubmitButton className="btn-primary w-full py-3">Enregistrer</SubmitButton>
    </ActionForm>
  );
}

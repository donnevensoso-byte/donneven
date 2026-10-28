"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function LoginForm({ suite }: { suite?: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={suite ?? ""} />
      <label className="block">
        <span className="label">E-mail</span>
        <input type="email" name="email" required autoComplete="email" className="input" />
      </label>
      <label className="block">
        <span className="label">Mot de passe</span>
        <input type="password" name="password" required autoComplete="current-password" className="input" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Connexion…">Se connecter</SubmitButton>
    </form>
  );
}

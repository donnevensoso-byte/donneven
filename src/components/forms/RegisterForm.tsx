"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import { TERRITORIES, getTerritory } from "@/lib/territories";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function RegisterForm({ suite }: { suite?: string }) {
  const [state, action] = useActionState(register, null);
  const [territory, setTerritory] = useState("guadeloupe");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={suite ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <label><span className="label">Prénom</span><input name="firstName" required autoComplete="given-name" className="input" /></label>
        <label><span className="label">Nom</span><input name="lastName" required autoComplete="family-name" className="input" /></label>
      </div>
      <label className="block"><span className="label">E-mail</span><input type="email" name="email" required autoComplete="email" className="input" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Territoire (ou destination)</span>
          <select name="territory" className="input" value={territory} onChange={(e) => setTerritory(e.target.value)}>
            {TERRITORIES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Téléphone</span>
          <input type="tel" name="phone" autoComplete="tel" className="input" placeholder={`${getTerritory(territory).phonePrefix} 690 12 34 56`} />
        </label>
      </div>
      <label className="block"><span className="label">Date de naissance</span><input type="date" name="birthDate" required className="input" /></label>
      <label className="block">
        <span className="label">Mot de passe</span>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className="input" />
        <span className="mt-1 block text-xs text-slate-500">8 caractères minimum.</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="cgu" required className="mt-1 accent-lagon-600" />
        <span>J&apos;accepte les <Link href="/cgu" className="text-lagon-700 underline" target="_blank">conditions générales</Link> et la politique de confidentialité.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Création…">Créer mon compte</SubmitButton>
    </form>
  );
}

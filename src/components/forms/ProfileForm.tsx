"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { TERRITORIES } from "@/lib/territories";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

type Props = { user: { firstName: string; lastName: string; phone: string | null; territory: string; bio: string | null; iban: string | null } };

export function ProfileForm({ user }: Props) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="label">Prénom</span><input name="firstName" defaultValue={user.firstName} required className="input" /></label>
        <label><span className="label">Nom</span><input name="lastName" defaultValue={user.lastName} required className="input" /></label>
        <label><span className="label">Téléphone</span><input name="phone" type="tel" defaultValue={user.phone ?? ""} className="input" /></label>
        <label>
          <span className="label">Territoire</span>
          <select name="territory" defaultValue={user.territory} className="input">
            {TERRITORIES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      </div>
      <label className="block"><span className="label">Photo de profil</span><input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="input" /></label>
      <label className="block">
        <span className="label">Présentation</span>
        <textarea name="bio" rows={3} defaultValue={user.bio ?? ""} className="input" placeholder="Quelques mots sur vous : d'où vous êtes, pourquoi vous louez…" />
      </label>
      <label className="block">
        <span className="label">IBAN (pour recevoir vos revenus de propriétaire)</span>
        <input name="iban" defaultValue={user.iban ?? ""} className="input font-mono" placeholder="FR76 …" />
      </label>
      <FormMessage state={state} />
      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}

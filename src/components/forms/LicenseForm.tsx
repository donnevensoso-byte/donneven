"use client";

import { useActionState } from "react";
import { submitLicense } from "@/app/actions/profile";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function LicenseForm({ number, issuedAt }: { number: string | null; issuedAt: string | null }) {
  const [state, action] = useActionState(submitLicense, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="label">Numéro de permis</span><input name="licenseNumber" defaultValue={number ?? ""} required className="input uppercase" /></label>
        <label><span className="label">Date d&apos;obtention (catégorie B)</span><input type="date" name="licenseIssuedAt" defaultValue={issuedAt ?? ""} required className="input" /></label>
      </div>
      <label className="block">
        <span className="label">Photo du permis (recto)</span>
        <input type="file" name="licenseFile" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" className="input" />
      </label>
      <FormMessage state={state} />
      <SubmitButton>Envoyer pour vérification</SubmitButton>
    </form>
  );
}

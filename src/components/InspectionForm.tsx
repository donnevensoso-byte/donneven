"use client";

import { useActionState, useState } from "react";
import { submitInspection } from "@/app/actions/bookings";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function InspectionForm({ bookingId, type, minMileage }: { bookingId: string; type: "CHECKIN" | "CHECKOUT"; minMileage?: number }) {
  const [state, action] = useActionState(submitInspection.bind(null, bookingId), null);
  const [fuel, setFuel] = useState(8);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Kilométrage au compteur</span>
          <input type="number" name="mileage" required min={minMileage ?? 0} className="input" placeholder={minMileage ? `≥ ${minMileage}` : "ex. 45230"} />
        </label>
        <label>
          <span className="label">Propreté</span>
          <select name="cleanliness" className="input" defaultValue="PROPRE">
            <option value="PROPRE">Propre</option>
            <option value="CORRECT">Correct (sable, poussière)</option>
            <option value="SALE">Sale</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Niveau de carburant / batterie : {fuel}/8</span>
        <input type="range" name="fuelLevel" min={0} max={8} value={fuel} onChange={(e) => setFuel(Number(e.target.value))} className="w-full accent-lagon-600" />
      </label>
      <label className="block">
        <span className="label">Dommages constatés</span>
        <textarea name="damages" rows={2} className="input" placeholder="Rayure portière arrière droite, impact pare-brise… (laisser vide si aucun)" />
      </label>
      <label className="block">
        <span className="label">Photos (4 angles + compteur recommandés)</span>
        <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" capture="environment" multiple className="input" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">
        {type === "CHECKIN" ? "Valider l'état des lieux de départ" : "Valider le retour du véhicule"}
      </SubmitButton>
    </form>
  );
}

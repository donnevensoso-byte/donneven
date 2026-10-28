"use client";

import { useActionState, useState } from "react";
import { CATEGORIES, CATEGORY_IDS, FEATURES, FUELS, PRICE_HINTS, TRANSMISSIONS, type Category } from "@/lib/constants";
import { TERRITORIES, findCommune, getTerritory } from "@/lib/territories";
import { PickerMap } from "../Maps";
import { EMPTY_VEHICLE, type VehicleFormValues } from "@/lib/vehicle-form";
import { FormMessage, type FormState } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

const eur = (cents: number) => String(cents / 100).replace(".", ",");

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

export function VehicleForm({ action, initial = EMPTY_VEHICLE, submitLabel }: { action: Action; initial?: VehicleFormValues; submitLabel: string }) {
  const [state, formAction] = useActionState(action, null);
  const [territoryId, setTerritoryId] = useState(initial.territory);
  const [communeName, setCommuneName] = useState(initial.commune);
  const [category, setCategory] = useState(initial.category as Category);
  const [pin, setPin] = useState<[number, number] | null>(initial.lat !== null && initial.lng !== null ? [initial.lat, initial.lng] : null);
  const [pinTouched, setPinTouched] = useState(false);
  const [airport, setAirport] = useState(initial.airportDelivery);
  const [port, setPort] = useState(initial.portDelivery);
  const territory = getTerritory(territoryId);
  const commune = findCommune(territoryId, communeName);
  const features = new Set(initial.features.split(",").filter(Boolean));
  const [low, high] = PRICE_HINTS[category];

  return (
    <form action={formAction} className="space-y-8">
      <Section title="Le véhicule">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marque"><input name="make" required defaultValue={initial.make} className="input" placeholder="Peugeot, Toyota, Dacia…" /></Field>
          <Field label="Modèle"><input name="model" required defaultValue={initial.model} className="input" placeholder="208, Yaris, Duster…" /></Field>
          <Field label="Année"><input name="year" type="number" required min={1990} max={new Date().getFullYear() + 1} defaultValue={initial.year} className="input" /></Field>
          <Field label="Catégorie">
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
              {CATEGORY_IDS.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
            </select>
          </Field>
          <Field label="Boîte de vitesses">
            <select name="transmission" defaultValue={initial.transmission} className="input">
              {Object.entries(TRANSMISSIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Énergie">
            <select name="fuel" defaultValue={initial.fuel} className="input">
              {Object.entries(FUELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Places"><input name="seats" type="number" min={1} max={9} defaultValue={initial.seats} className="input" /></Field>
          <Field label="Portes"><input name="doors" type="number" min={0} max={5} defaultValue={initial.doors} className="input" /></Field>
          <Field label="Couleur (illustration)"><input name="color" type="color" defaultValue={initial.color} className="input h-[42px] p-1" /></Field>
        </div>
        <Check name="airConditioning" defaultChecked={initial.airConditioning} label="Climatisation" hint="Indispensable sous nos latitudes : les annonces climatisées sont 3× plus réservées." />
        <div>
          <span className="label">Équipements</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="features" value={f} defaultChecked={features.has(f)} className="accent-lagon-600" /> {f}
              </label>
            ))}
          </div>
        </div>
        <Field label="Photos">
          <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple className="input" />
          <span className="mt-1 block text-xs text-slate-500">Jusqu&apos;à 10 photos, 8 Mo max chacune. Prenez-les en plein jour, de 3/4 avant.</span>
        </Field>
        <Field label="Description">
          <textarea name="description" rows={4} defaultValue={initial.description} className="input" placeholder="Parfaite pour faire le tour de l'île, consommation raisonnable, coffre assez grand pour 2 valises…" />
        </Field>
        <Field label="Règles">
          <textarea name="rules" rows={2} defaultValue={initial.rules} className="input" />
        </Field>
      </Section>

      <Section title="Où se trouve-t-il ?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Territoire">
            <select name="territory" value={territoryId} onChange={(e) => { setTerritoryId(e.target.value); setCommuneName(""); setPin(null); }} className="input">
              {TERRITORIES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Commune">
            <select name="commune" required value={communeName} onChange={(e) => { setCommuneName(e.target.value); if (!pinTouched) setPin(null); }} className="input">
              <option value="">Choisir…</option>
              {territory.communes.map((c) => (
                <option key={c.name} value={c.name}>{c.name}{c.island ? ` (${c.island})` : ""}{c.roadAccess === false ? " — sans accès routier" : ""}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Adresse ou point de rendez-vous (communiqué uniquement après confirmation)">
          <input name="address" defaultValue={initial.address} className="input" placeholder="Parking de la résidence Les Flamboyants, 12 rue…" />
        </Field>
        <div>
          <span className="label">Position précise (facultatif) : touchez la carte</span>
          <div className="h-64">
            <PickerMap
              center={commune ? [commune.lat, commune.lng] : territory.center}
              zoom={commune ? 14 : territory.zoom}
              value={pin}
              onPick={(lat, lng) => { setPin([lat, lng]); setPinTouched(true); }}
            />
          </div>
          <input type="hidden" name="lat" value={pinTouched && pin ? pin[0] : ""} />
          <input type="hidden" name="lng" value={pinTouched && pin ? pin[1] : ""} />
          <p className="mt-1 text-xs text-slate-500">Sur l&apos;annonce publique, seule une zone approximative est affichée.</p>
        </div>
      </Section>

      <Section title="Tarifs et conditions">
        <p className="rounded-xl bg-lagon-50 px-4 py-3 text-sm text-lagon-900">
          💡 Prix conseillé pour un(e) {CATEGORIES[category].label.toLowerCase()} : <strong>{low} à {high} € / jour</strong>.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Prix par jour (€)"><input name="pricePerDay" inputMode="decimal" required defaultValue={eur(initial.pricePerDay)} className="input" /></Field>
          <Field label="Remise dès 7 jours (%)"><input name="weeklyDiscountPct" type="number" min={0} max={60} defaultValue={initial.weeklyDiscountPct} className="input" /></Field>
          <Field label="Remise dès 28 jours (%)"><input name="monthlyDiscountPct" type="number" min={0} max={70} defaultValue={initial.monthlyDiscountPct} className="input" /></Field>
          <Field label="Caution (€)"><input name="depositAmount" inputMode="decimal" defaultValue={eur(initial.depositAmount)} className="input" /></Field>
          <Field label="Km inclus par jour"><input name="kmIncludedPerDay" type="number" min={0} defaultValue={initial.kmIncludedPerDay} className="input" /></Field>
          <Field label="Prix du km supplémentaire (€)"><input name="extraKmPrice" inputMode="decimal" defaultValue={eur(initial.extraKmPrice)} className="input" /></Field>
          <Field label="Durée minimum (jours)"><input name="minDays" type="number" min={1} defaultValue={initial.minDays} className="input" /></Field>
          <Field label="Durée maximum (jours)"><input name="maxDays" type="number" min={1} defaultValue={initial.maxDays} className="input" /></Field>
        </div>
        <Check name="instantBooking" defaultChecked={initial.instantBooking} label="⚡ Réservation instantanée" hint="Les locataires réservent sans attendre votre accord. Vous recevez 2× plus de réservations." />
      </Section>

      <Section title="Options Antilles-Guyane">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Check name="airportDelivery" checked={airport} onChange={setAirport} label="✈︎ Livraison à l'aéroport" hint={territory.hubs.find((h) => h.kind === "AEROPORT")?.name} />
            {airport && <Field label="Frais de livraison aéroport (€)"><input name="airportFee" inputMode="decimal" defaultValue={eur(initial.airportFee)} className="input" /></Field>}
            {!airport && <input type="hidden" name="airportFee" value={eur(initial.airportFee)} />}
          </div>
          <div className="space-y-2">
            <Check name="portDelivery" checked={port} onChange={setPort} label="⚓ Livraison au port / gare maritime" hint={territory.hubs.find((h) => h.kind === "PORT")?.name} />
            {port && <Field label="Frais de livraison port (€)"><input name="portFee" inputMode="decimal" defaultValue={eur(initial.portFee)} className="input" /></Field>}
            {!port && <input type="hidden" name="portFee" value={eur(initial.portFee)} />}
          </div>
          {territory.ferryDestinations.length > 0 && (
            <Check name="ferryAllowed" defaultChecked={initial.ferryAllowed} label="⛴ Autoriser le passage en ferry" hint={`Vers ${territory.ferryDestinations.join(", ")}`} />
          )}
          {territoryId === "guyane" && (
            <Check name="trackAllowed" defaultChecked={initial.trackAllowed} label="🌳 Autoriser les pistes" hint="Routes en latérite, accès aux criques et carbets. Recommandé pour les 4x4." />
          )}
        </div>
      </Section>

      <FormMessage state={state} />
      <div className="sticky bottom-[64px] z-20 -mx-4 border-t border-slate-200 bg-sable-50/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <SubmitButton className="btn-accent w-full py-3 text-base md:w-auto" pendingLabel="Enregistrement…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5 md:p-6">
      <h2 className="heading text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Check({
  name, label, hint, defaultChecked, checked, onChange,
}: { name: string; label: string; hint?: string; defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <input
        type="checkbox"
        name={name}
        className="mt-1 h-4 w-4 accent-lagon-600"
        {...(checked !== undefined ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) } : { defaultChecked })}
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

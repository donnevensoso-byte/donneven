"use client";

import { useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/errors";
import { CATEGORIES, CONDITIONS, getCommune } from "@/lib/guyane";
import { ActionForm, FieldError, FormMessage, SubmitButton, useActionForm } from "./form";
import { LocationPicker } from "./map";
import { PhotoInput } from "./photo-input";

export type ListingFormDefaults = {
  title?: string;
  description?: string;
  category?: string;
  brand?: string | null;
  condition?: string;
  dayPrice?: string;
  weekPrice?: string;
  deposit?: string;
  minDays?: number;
  minNoticeDays?: number;
  commune?: string;
  neighborhood?: string | null;
  lat?: number;
  lng?: number;
  delivery?: boolean;
  pickupNotes?: string | null;
};

function Section({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function ListingForm({
  action,
  defaults = {},
  existingPhotos = [],
  maxPhotos,
  communeOptions,
  submitLabel,
}: {
  action: (prev: ActionState | undefined, formData: FormData) => Promise<ActionState>;
  defaults?: ListingFormDefaults;
  existingPhotos?: { id: string }[];
  maxPhotos: number;
  communeOptions: ReactNode;
  submitLabel: string;
}) {
  const form = useActionForm(action);
  const { state } = form;
  const [commune, setCommune] = useState(defaults.commune ?? "");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    defaults.lat != null && defaults.lng != null ? { lat: defaults.lat, lng: defaults.lng } : null,
  );
  const communeCenter = getCommune(commune);
  // En modification, la carte s'ouvre sur le point existant.
  const center =
    commune === defaults.commune && defaults.lat != null && defaults.lng != null
      ? { lat: defaults.lat, lng: defaults.lng }
      : communeCenter;
  const err = (name: string) => (state?.fieldErrors?.[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});

  return (
    <ActionForm form={form} className="space-y-5">
      <FormMessage state={state} />

      <Section title="Photos" hint="Les annonces avec plusieurs photos nettes sont louées bien plus souvent.">
        <PhotoInput max={maxPhotos} existing={existingPhotos} />
      </Section>

      <Section title="Votre matériel">
        <div>
          <label className="label" htmlFor="title">Titre de l&apos;annonce</label>
          <input className="input" id="title" name="title" defaultValue={defaults.title} maxLength={80} placeholder="Ex. Débroussailleuse thermique Stihl FS 131" {...err("title")} />
          <FieldError state={state} name="title" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Catégorie</label>
            <select className="input" id="category" name="category" defaultValue={defaults.category ?? ""} {...err("category")}>
              <option value="" disabled>Choisir…</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <FieldError state={state} name="category" />
          </div>
          <div>
            <label className="label" htmlFor="condition">État</label>
            <select className="input" id="condition" name="condition" defaultValue={defaults.condition ?? ""} {...err("condition")}>
              <option value="" disabled>Choisir…</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <FieldError state={state} name="condition" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="brand">Marque et modèle <span className="font-normal text-muted">(facultatif)</span></label>
          <input className="input" id="brand" name="brand" defaultValue={defaults.brand ?? ""} maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            className="input min-h-36"
            id="description"
            name="description"
            defaultValue={defaults.description}
            maxLength={3000}
            placeholder="Puissance, accessoires fournis (fil, lames, rallonge…), carburant ou batterie, conseils d'utilisation…"
            {...err("description")}
          />
          <FieldError state={state} name="description" />
        </div>
      </Section>

      <Section title="Prix et caution" hint="Astuce : un prix journalier autour de 5 à 10 % du prix neuf est attractif.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="dayPrice">Prix par jour (€)</label>
            <input className="input" id="dayPrice" name="dayPrice" inputMode="decimal" defaultValue={defaults.dayPrice} placeholder="15" {...err("dayPrice")} />
            <FieldError state={state} name="dayPrice" />
          </div>
          <div>
            <label className="label" htmlFor="weekPrice">Prix semaine (€) <span className="font-normal text-muted">(option)</span></label>
            <input className="input" id="weekPrice" name="weekPrice" inputMode="decimal" defaultValue={defaults.weekPrice} placeholder="70" {...err("weekPrice")} />
            <FieldError state={state} name="weekPrice" />
          </div>
          <div>
            <label className="label" htmlFor="deposit">Caution (€)</label>
            <input className="input" id="deposit" name="deposit" inputMode="decimal" defaultValue={defaults.deposit} placeholder="150" {...err("deposit")} />
            <FieldError state={state} name="deposit" />
          </div>
        </div>
        <p className="hint">La caution est remise en main propre (chèque ou espèces) et rendue au retour du matériel en bon état.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="minDays">Durée minimale</label>
            <select className="input" id="minDays" name="minDays" defaultValue={String(defaults.minDays ?? 1)}>
              {[1, 2, 3, 7].map((d) => (
                <option key={d} value={d}>{d} jour{d > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="minNoticeDays">Réservation au plus tard</label>
            <select className="input" id="minNoticeDays" name="minNoticeDays" defaultValue={String(defaults.minNoticeDays ?? 0)}>
              <option value="0">Le jour même</option>
              {[1, 2, 3, 4, 7].map((d) => (
                <option key={d} value={d}>{d} jour{d > 1 ? "s" : ""} avant</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Lieu de retrait" hint="Votre adresse exacte n'est jamais affichée : seule une zone approximative est visible.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="commune">Commune</label>
            <select
              className="input"
              id="commune"
              name="commune"
              value={commune}
              onChange={(e) => {
                setCommune(e.target.value);
                setPoint(null);
              }}
              {...err("commune")}
            >
              <option value="" disabled>Choisir…</option>
              {communeOptions}
            </select>
            <FieldError state={state} name="commune" />
          </div>
          <div>
            <label className="label" htmlFor="neighborhood">Quartier <span className="font-normal text-muted">(facultatif)</span></label>
            <input className="input" id="neighborhood" name="neighborhood" defaultValue={defaults.neighborhood ?? ""} maxLength={80} placeholder="Ex. Zéphir, Balata, Soula…" />
          </div>
        </div>
        {center && (
          <div>
            <p className="label">Placez le point près de chez vous <span className="font-normal text-muted">(facultatif)</span></p>
            <div className="h-64 overflow-hidden rounded-xl border border-line">
              <LocationPicker center={center} value={point} onPick={(lat, lng) => setPoint({ lat, lng })} />
            </div>
            <p className="hint">Touchez la carte pour indiquer votre secteur. Sans point, nous utilisons le centre de la commune.</p>
          </div>
        )}
        <input type="hidden" name="lat" value={point?.lat ?? ""} />
        <input type="hidden" name="lng" value={point?.lng ?? ""} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="delivery" defaultChecked={defaults.delivery} className="size-4 accent-brand-600" />
          Je peux livrer le matériel (à convenir avec le locataire)
        </label>
        <div>
          <label className="label" htmlFor="pickupNotes">Infos de retrait <span className="font-normal text-muted">(visibles après confirmation)</span></label>
          <textarea className="input min-h-20" id="pickupNotes" name="pickupNotes" defaultValue={defaults.pickupNotes ?? ""} maxLength={500} placeholder="Ex. Disponible le soir après 17 h et le week-end. Prévoir un pick-up pour la remorque." />
        </div>
      </Section>

      <div className="sticky bottom-16 z-10 -mx-4 border-t border-line bg-sand/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <SubmitButton className="btn-primary w-full py-3 text-base md:w-auto md:px-8" pendingLabel="Enregistrement…">
          {submitLabel}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

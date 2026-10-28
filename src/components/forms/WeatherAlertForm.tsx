"use client";

import { useActionState } from "react";
import { createWeatherAlert } from "@/app/actions/admin";
import { WEATHER_LEVELS } from "@/lib/constants";
import { TERRITORIES } from "@/lib/territories";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function WeatherAlertForm() {
  const [state, action] = useActionState(createWeatherAlert, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
      <label>
        <span className="label">Territoire</span>
        <select name="territory" className="input">{TERRITORIES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </label>
      <label>
        <span className="label">Niveau</span>
        <select name="level" className="input">{Object.entries(WEATHER_LEVELS).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}</select>
      </label>
      <label>
        <span className="label">Intitulé</span>
        <input name="title" required className="input" placeholder="Ouragan Ernesto — passage prévu dans la nuit" />
      </label>
      <SubmitButton className="btn-accent">Publier</SubmitButton>
      <div className="sm:col-span-4"><FormMessage state={state} /></div>
    </form>
  );
}

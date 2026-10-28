"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createBooking } from "@/app/actions/bookings";
import { INSURANCE_PLANS, type InsurancePlan, type PickupOption } from "@/lib/constants";
import { computePrice, insurancePerDay, type PricingVehicle } from "@/lib/pricing";
import { HOURS } from "@/lib/dates";
import { euros } from "@/lib/format";
import { isRangeFree } from "@/lib/availability";
import { PriceDetails } from "./PriceDetails";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

type Props = {
  vehicleId: string;
  vehicle: PricingVehicle & { instantBooking: boolean; minDays: number; maxDays: number };
  utcOffset: string;
  hubs: { AEROPORT?: string; PORT?: string };
  taken: { startAt: string; endAt: string }[];
  defaults: { debut?: string; fin?: string; hdebut?: string; hfin?: string; livraison?: string };
  today: string;
  user: { loggedIn: boolean; youngDriver: boolean; licenseOk: boolean; isOwner: boolean };
};

export function BookingWidget({ vehicleId, vehicle, utcOffset, hubs, taken, defaults, today, user }: Props) {
  const [state, action] = useActionState(createBooking.bind(null, vehicleId), null);
  const [start, setStart] = useState(defaults.debut ?? "");
  const [end, setEnd] = useState(defaults.fin ?? "");
  const [startTime, setStartTime] = useState(defaults.hdebut ?? "10:00");
  const [endTime, setEndTime] = useState(defaults.hfin ?? "10:00");
  const [plan, setPlan] = useState<InsurancePlan>("CONFORT");
  const initialPickup = (defaults.livraison === "AEROPORT" && vehicle.airportDelivery) || (defaults.livraison === "PORT" && vehicle.portDelivery) ? (defaults.livraison as PickupOption) : "SUR_PLACE";
  const [pickup, setPickup] = useState<PickupOption>(initialPickup);

  const range = useMemo(() => {
    if (!start || !end) return null;
    const s = new Date(`${start}T${startTime}:00${utcOffset}`);
    const e = new Date(`${end}T${endTime}:00${utcOffset}`);
    return e > s ? { startAt: s, endAt: e } : null;
  }, [start, end, startTime, endTime, utcOffset]);

  const price = range ? computePrice({ vehicle, ...range, insurancePlan: plan, pickupOption: pickup, youngDriver: user.youngDriver }) : null;
  const free = range ? isRangeFree(range, taken.map((t) => ({ startAt: new Date(t.startAt), endAt: new Date(t.endAt) }))) : true;
  const durationError = price && (price.days < vehicle.minDays ? `Minimum ${vehicle.minDays} jour(s)` : price.days > vehicle.maxDays ? `Maximum ${vehicle.maxDays} jours` : null);

  return (
    <form action={action} className="card space-y-4 p-5" id="reserver">
      <p>
        <span className="text-2xl font-bold">{euros(vehicle.pricePerDay)}</span>
        <span className="text-slate-500"> / jour</span>
      </p>
      {(vehicle.weeklyDiscountPct > 0 || vehicle.monthlyDiscountPct > 0) && (
        <p className="-mt-3 text-xs text-emerald-700">
          {vehicle.weeklyDiscountPct > 0 && `-${vehicle.weeklyDiscountPct} % dès 7 jours`}
          {vehicle.weeklyDiscountPct > 0 && vehicle.monthlyDiscountPct > 0 && " · "}
          {vehicle.monthlyDiscountPct > 0 && `-${vehicle.monthlyDiscountPct} % dès 28 jours`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 sm:col-span-1">
          <span className="label">Départ</span>
          <input type="date" name="start" required min={today} value={start} onChange={(e) => setStart(e.target.value)} className="input" />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="label">Heure</span>
          <select name="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input">
            {HOURS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="label">Retour</span>
          <input type="date" name="end" required min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} className="input" />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="label">Heure</span>
          <select name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input">
            {HOURS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="label">Remise des clés</legend>
        <div className="space-y-2">
          <Radio name="pickupOption" value="SUR_PLACE" checked={pickup === "SUR_PLACE"} onChange={() => setPickup("SUR_PLACE")} title="Chez le propriétaire" />
          {vehicle.airportDelivery && hubs.AEROPORT && (
            <Radio name="pickupOption" value="AEROPORT" checked={pickup === "AEROPORT"} onChange={() => setPickup("AEROPORT")} title={`✈︎ ${hubs.AEROPORT}`} extra={`+ ${euros(vehicle.airportFee)}`} />
          )}
          {vehicle.portDelivery && hubs.PORT && (
            <Radio name="pickupOption" value="PORT" checked={pickup === "PORT"} onChange={() => setPickup("PORT")} title={`⚓ ${hubs.PORT}`} extra={`+ ${euros(vehicle.portFee)}`} />
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Assurance</legend>
        <div className="space-y-2">
          {(Object.keys(INSURANCE_PLANS) as InsurancePlan[]).map((p) => (
            <Radio
              key={p}
              name="insurancePlan"
              value={p}
              checked={plan === p}
              onChange={() => setPlan(p)}
              title={INSURANCE_PLANS[p].label}
              extra={`${euros(insurancePerDay(p, vehicle.category))} / j`}
              description={INSURANCE_PLANS[p].description}
            />
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="label">Message au propriétaire {vehicle.instantBooking ? "(facultatif)" : ""}</span>
        <textarea name="message" rows={3} className="input" placeholder="Bonjour ! Je viens en vacances avec ma famille, j'atterris à 14 h…" />
      </label>

      {price && free && !durationError && <PriceDetails p={price} plan={plan} />}
      {range && !free && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Le véhicule n&apos;est pas disponible sur ces dates.</p>}
      {durationError && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{durationError}</p>}
      {user.youngDriver && <p className="text-xs text-slate-500">Permis de moins de 3 ans : un supplément jeune conducteur s&apos;applique.</p>}

      <FormMessage state={state} />

      {!user.loggedIn ? (
        <Link href={`/connexion?suite=/vehicules/${vehicleId}`} className="btn-accent w-full">Se connecter pour réserver</Link>
      ) : user.isOwner ? (
        <Link href={`/proprietaire/vehicules/${vehicleId}`} className="btn-outline w-full">Gérer mon annonce</Link>
      ) : !user.licenseOk ? (
        <Link href="/compte#permis" className="btn-accent w-full">Ajouter mon permis pour réserver</Link>
      ) : (
        <SubmitButton className="btn-accent w-full py-3 text-base" disabled={!price || !free || Boolean(durationError)} pendingLabel="Envoi…">
          {vehicle.instantBooking ? "⚡ Réserver maintenant" : "Envoyer la demande"}
        </SubmitButton>
      )}
      <p className="text-center text-xs text-slate-500">
        {vehicle.instantBooking ? "Confirmation immédiate, vous payez à l'étape suivante." : "Aucun débit tant que le propriétaire n'a pas accepté."}
      </p>
    </form>
  );
}

function Radio({
  name,
  value,
  checked,
  onChange,
  title,
  extra,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  extra?: string;
  description?: string;
}) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${checked ? "border-lagon-500 bg-lagon-50" : "border-slate-200 hover:border-slate-300"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-0.5 accent-lagon-600" />
      <span className="flex-1">
        <span className="flex justify-between gap-2 font-medium">
          <span>{title}</span>
          {extra && <span className="shrink-0 text-slate-600">{extra}</span>}
        </span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

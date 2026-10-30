"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { requestBookingAction } from "@/app/actions/bookings";
import { addDays, formatDate, periodsOverlap, rentalDays } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { computePrice } from "@/lib/pricing";
import { ActionForm, FormMessage, SubmitButton, useActionForm } from "./form";

type Props = {
  listingId: string;
  dayPrice: number;
  weekPrice: number | null;
  deposit: number;
  minDays: number;
  unavailable: { start: string; end: string }[];
  today: string;
  maxDays: number;
  online: boolean;
  feePercent: number;
  loggedIn: boolean;
};

export function BookingWidget(props: Props) {
  const form = useActionForm(requestBookingAction.bind(null, props.listingId));
  const { state } = form;
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const quote = useMemo(() => {
    if (!start || !end || end < start) return null;
    const days = rentalDays(start, end);
    if (days < 1) return null;
    return computePrice({
      dayPrice: props.dayPrice,
      weekPrice: props.weekPrice,
      days,
      serviceFeePercent: props.online ? props.feePercent : 0,
    });
  }, [start, end, props.dayPrice, props.weekPrice, props.online, props.feePercent]);

  const conflict = start && end && props.unavailable.some((p) => periodsOverlap(start, end, p.start, p.end));
  const tooShort = quote && quote.days < props.minDays;
  const tooLong = quote && quote.days > props.maxDays;

  return (
    <ActionForm form={form} className="space-y-4" aria-label="Réserver">
      <div>
        <p className="text-2xl font-bold">
          {formatEuros(props.dayPrice)} <span className="text-base font-normal text-muted">/ jour</span>
        </p>
        {props.weekPrice && <p className="text-sm text-muted">{formatEuros(props.weekPrice)} la semaine</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="start">Début</label>
          <input
            className="input px-2.5"
            type="date"
            id="start"
            name="start"
            min={props.today}
            max={addDays(props.today, 180)}
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (!end || end < e.target.value) setEnd(addDays(e.target.value, Math.max(props.minDays, 1) - 1));
            }}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="end">Fin (incluse)</label>
          <input className="input px-2.5" type="date" id="end" name="end" min={start || props.today} value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
      </div>

      {conflict && <p className="text-sm font-medium text-flame-500">Le matériel est déjà réservé sur une partie de ces dates.</p>}
      {tooShort && <p className="text-sm font-medium text-flame-500">Durée minimale : {props.minDays} jours.</p>}
      {tooLong && <p className="text-sm font-medium text-flame-500">Location limitée à {props.maxDays} jours.</p>}

      {quote && !conflict && (
        <dl className="space-y-1.5 rounded-xl bg-sand p-3 text-sm" data-testid="price-breakdown">
          <div className="flex justify-between">
            <dt>
              {quote.weeks > 0
                ? `${quote.weeks} sem. + ${quote.extraDays} j`
                : `${formatEuros(props.dayPrice)} × ${quote.days} jour${quote.days > 1 ? "s" : ""}`}
            </dt>
            <dd>{formatEuros(quote.rentalAmount)}</dd>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>Économie tarif semaine</dt>
              <dd>−{formatEuros(quote.discount)}</dd>
            </div>
          )}
          {quote.serviceFee > 0 && (
            <div className="flex justify-between">
              <dt>Frais de service</dt>
              <dd>{formatEuros(quote.serviceFee)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
            <dt>Total {props.online ? "payé en ligne" : "à régler sur place"}</dt>
            <dd>{formatEuros(quote.total)}</dd>
          </div>
          {props.deposit > 0 && (
            <div className="flex justify-between text-muted">
              <dt>Caution (rendue au retour)</dt>
              <dd>{formatEuros(props.deposit)}</dd>
            </div>
          )}
        </dl>
      )}

      <div>
        <label className="label" htmlFor="message">Message au propriétaire</label>
        <textarea
          className="input min-h-20"
          id="message"
          name="message"
          maxLength={2000}
          placeholder="Bonjour ! J'en aurais besoin pour débroussailler mon terrain à…"
        />
      </div>

      <FormMessage state={state} />

      {props.loggedIn ? (
        <SubmitButton className="btn-primary w-full py-3 text-base" pendingLabel="Envoi de la demande…">
          Demander à réserver
        </SubmitButton>
      ) : (
        <Link href={`/connexion?next=/annonces/${props.listingId}`} className="btn-primary w-full py-3 text-base">
          Se connecter pour réserver
        </Link>
      )}
      <p className="text-center text-xs text-muted">
        {props.online
          ? "Empreinte bancaire à la demande : vous n'êtes débité que si le propriétaire accepte (sous 48 h)."
          : "Vous ne payez rien maintenant. Le propriétaire a 48 h pour accepter."}
      </p>

      {props.unavailable.length > 0 && (
        <div className="border-t border-line pt-3">
          <p className="text-xs font-semibold text-muted uppercase">Déjà indisponible</p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted">
            {props.unavailable.slice(0, 6).map((p) => (
              <li key={`${p.start}-${p.end}`}>
                {p.start === p.end ? formatDate(p.start) : `${formatDate(p.start)} → ${formatDate(p.end)}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ActionForm>
  );
}

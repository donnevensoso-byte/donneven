import { INSURANCE_PLANS, type InsurancePlan } from "@/lib/constants";
import { euros, plural } from "@/lib/format";
import type { PriceBreakdown } from "@/lib/pricing";

export function PriceDetails({ p, plan, showOwner = false }: { p: Omit<PriceBreakdown, "deductible" | "discountPct"> & { discountPct?: number }; plan: string; showOwner?: boolean }) {
  const rows: [string, number][] = [
    [`Location (${plural(p.days, "jour")})`, p.basePrice],
    ...(p.discount ? [[`Remise longue durée${p.discountPct ? ` (-${p.discountPct} %)` : ""}`, -p.discount] as [string, number]] : []),
    ...(p.deliveryFee ? [["Livraison", p.deliveryFee] as [string, number]] : []),
    [`Assurance ${INSURANCE_PLANS[plan as InsurancePlan]?.label ?? ""}`, p.insuranceFee],
    ...(p.youngDriverFee ? [["Supplément jeune conducteur", p.youngDriverFee] as [string, number]] : []),
    ["Frais de service", p.serviceFee],
  ];
  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-slate-600">{label}</dt>
          <dd className={value < 0 ? "font-medium text-emerald-700" : ""}>{value < 0 ? `− ${euros(-value)}` : euros(value)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
        <dt>Total</dt>
        <dd>{euros(p.total)}</dd>
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <dt>Caution (empreinte bancaire, non débitée)</dt>
        <dd>{euros(p.deposit)}</dd>
      </div>
      {showOwner && (
        <div className="flex justify-between rounded-lg bg-lagon-50 px-3 py-2 font-semibold text-lagon-800">
          <dt>Revenu propriétaire</dt>
          <dd>{euros(p.ownerPayout)}</dd>
        </div>
      )}
    </dl>
  );
}

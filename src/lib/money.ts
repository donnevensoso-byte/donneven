const formatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const roundFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Affiche un montant en centimes : 1250 → « 12,50 € », 1200 → « 12 € ». */
export function formatEuros(cents: number): string {
  return cents % 100 === 0 ? roundFormatter.format(cents / 100) : formatter.format(cents / 100);
}

/** Convertit une saisie « 12,50 » ou « 12.5 » en centimes ; null si invalide. */
export function parseEuros(input: string | null | undefined): number | null {
  if (input == null) return null;
  const normalized = input.trim().replace(/\s|€/g, "").replace(",", ".");
  if (normalized === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

import { describe, expect, it } from "vitest";
import { computePrice } from "@/lib/pricing";

describe("computePrice", () => {
  it("facture au jour sans tarif semaine", () => {
    expect(computePrice({ dayPrice: 2500, days: 3 })).toMatchObject({ rentalAmount: 7500, serviceFee: 0, total: 7500, discount: 0 });
  });

  it("applique le tarif semaine par tranche de 7 jours", () => {
    const p = computePrice({ dayPrice: 2500, weekPrice: 12000, days: 9 });
    expect(p).toMatchObject({ weeks: 1, extraDays: 2, rentalAmount: 12000 + 5000, discount: 22500 - 17000 });
  });

  it("ne facture jamais les jours restants plus cher qu'une semaine", () => {
    const p = computePrice({ dayPrice: 2500, weekPrice: 12000, days: 13 });
    expect(p.rentalAmount).toBe(24000);
  });

  it("ignore un tarif semaine moins avantageux que 7 jours", () => {
    expect(computePrice({ dayPrice: 1000, weekPrice: 8000, days: 7 }).rentalAmount).toBe(7000);
  });

  it("ajoute les frais de service arrondis au centime", () => {
    expect(computePrice({ dayPrice: 1999, days: 1, serviceFeePercent: 10 })).toMatchObject({ serviceFee: 200, total: 2199 });
  });

  it("refuse une durée nulle", () => {
    expect(() => computePrice({ dayPrice: 1000, days: 0 })).toThrow();
  });
});

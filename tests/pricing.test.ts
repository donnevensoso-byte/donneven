import { describe, expect, it } from "vitest";
import { ageAt, billableDays, computePrice, insurancePerDay, isYoungDriver } from "@/lib/pricing";

const vehicle = {
  category: "CITADINE",
  pricePerDay: 3000,
  weeklyDiscountPct: 10,
  monthlyDiscountPct: 25,
  depositAmount: 80000,
  airportDelivery: true,
  airportFee: 2500,
  portDelivery: false,
  portFee: 2000,
};
const at = (iso: string) => new Date(iso);

describe("billableDays", () => {
  it("compte les tranches de 24 h entamées", () => {
    expect(billableDays(at("2026-11-01T10:00:00-04:00"), at("2026-11-02T10:00:00-04:00"))).toBe(1);
    expect(billableDays(at("2026-11-01T10:00:00-04:00"), at("2026-11-02T11:00:00-04:00"))).toBe(2);
    expect(billableDays(at("2026-11-01T10:00:00-04:00"), at("2026-11-01T14:00:00-04:00"))).toBe(1);
  });
  it("renvoie 0 pour un intervalle vide ou inversé", () => {
    expect(billableDays(at("2026-11-02T10:00:00Z"), at("2026-11-01T10:00:00Z"))).toBe(0);
  });
});

describe("computePrice", () => {
  it("calcule une location courte sans remise", () => {
    const p = computePrice({ vehicle, startAt: at("2026-11-01T10:00:00-04:00"), endAt: at("2026-11-04T10:00:00-04:00"), insurancePlan: "ESSENTIELLE", pickupOption: "SUR_PLACE" });
    expect(p.days).toBe(3);
    expect(p.basePrice).toBe(9000);
    expect(p.discount).toBe(0);
    expect(p.insuranceFee).toBe(2700);
    expect(p.serviceFee).toBe(900);
    expect(p.total).toBe(9000 + 2700 + 900);
    expect(p.ownerPayout).toBe(7200);
    expect(p.deductible).toBe(80000);
  });

  it("applique la remise semaine et la livraison aéroport", () => {
    const p = computePrice({ vehicle, startAt: at("2026-11-01T10:00:00-04:00"), endAt: at("2026-11-08T10:00:00-04:00"), insurancePlan: "SERENITE", pickupOption: "AEROPORT" });
    expect(p.days).toBe(7);
    expect(p.discount).toBe(2100);
    expect(p.deliveryFee).toBe(2500);
    expect(p.deductible).toBe(0);
    expect(p.ownerPayout).toBe(Math.round((21000 - 2100 + 2500) * 0.8));
  });

  it("applique la remise mois dès 28 jours", () => {
    const p = computePrice({ vehicle, startAt: at("2026-11-01T10:00:00Z"), endAt: at("2026-11-29T10:00:00Z"), insurancePlan: "CONFORT", pickupOption: "SUR_PLACE" });
    expect(p.discountPct).toBe(25);
  });

  it("ignore la livraison au port si elle n'est pas proposée", () => {
    const p = computePrice({ vehicle, startAt: at("2026-11-01T10:00:00Z"), endAt: at("2026-11-02T10:00:00Z"), insurancePlan: "CONFORT", pickupOption: "PORT" });
    expect(p.deliveryFee).toBe(0);
  });

  it("ajoute le supplément jeune conducteur et un minimum de frais de service", () => {
    const cheap = { ...vehicle, category: "SCOOTER", pricePerDay: 1500 };
    const p = computePrice({ vehicle: cheap, startAt: at("2026-11-01T10:00:00Z"), endAt: at("2026-11-02T10:00:00Z"), insurancePlan: "ESSENTIELLE", pickupOption: "SUR_PLACE", youngDriver: true });
    expect(p.youngDriverFee).toBe(700);
    expect(p.serviceFee).toBe(300);
    expect(p.insuranceFee).toBe(540);
  });
});

describe("assurance et conducteur", () => {
  it("module l'assurance selon la catégorie", () => {
    expect(insurancePerDay("CONFORT", "QUATRE_QUATRE")).toBe(1950);
    expect(insurancePerDay("CONFORT", "INCONNUE")).toBe(1500);
  });
  it("détecte les permis de moins de 3 ans", () => {
    const now = at("2026-10-28T12:00:00Z");
    expect(isYoungDriver(at("2024-06-01T00:00:00Z"), now)).toBe(true);
    expect(isYoungDriver(at("2020-06-01T00:00:00Z"), now)).toBe(false);
    expect(isYoungDriver(null, now)).toBe(false);
  });
  it("calcule l'âge", () => {
    expect(ageAt(at("2005-10-29T12:00:00Z"), at("2026-10-28T12:00:00Z"))).toBe(20);
    expect(ageAt(at("2005-10-28T12:00:00Z"), at("2026-10-28T12:00:00Z"))).toBe(21);
  });
});

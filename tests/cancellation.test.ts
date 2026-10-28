import { describe, expect, it } from "vitest";
import { computeCancellation } from "@/lib/cancellation";

const base = {
  status: "CONFIRMED" as const,
  paid: true,
  total: 20000,
  serviceFee: 1500,
  startAt: new Date("2026-11-10T10:00:00Z"),
  by: "RENTER" as const,
  severeWeather: false,
};

describe("politique d'annulation", () => {
  it("rembourse hors frais de service à plus de 48 h", () => {
    const r = computeCancellation({ ...base, now: new Date("2026-11-05T10:00:00Z") });
    expect(r).toMatchObject({ allowed: true, refund: 18500 });
  });
  it("rembourse 50 % hors frais à moins de 48 h", () => {
    const r = computeCancellation({ ...base, now: new Date("2026-11-09T10:00:00Z") });
    expect(r.refund).toBe(9250);
  });
  it("Garantie Cyclone : remboursement intégral même au dernier moment", () => {
    const r = computeCancellation({ ...base, now: new Date("2026-11-10T08:00:00Z"), severeWeather: true });
    expect(r.refund).toBe(20000);
    expect(r.policy).toContain("Cyclone");
  });
  it("rembourse intégralement si le propriétaire annule", () => {
    const r = computeCancellation({ ...base, by: "OWNER", now: new Date("2026-11-09T10:00:00Z") });
    expect(r.refund).toBe(20000);
  });
  it("annulation gratuite avant paiement", () => {
    const r = computeCancellation({ ...base, status: "PENDING", paid: false, now: new Date("2026-11-09T10:00:00Z") });
    expect(r).toMatchObject({ allowed: true, refund: 0 });
  });
  it("refuse l'annulation d'une location en cours", () => {
    const r = computeCancellation({ ...base, status: "IN_PROGRESS", now: new Date("2026-11-11T10:00:00Z") });
    expect(r.allowed).toBe(false);
  });
});

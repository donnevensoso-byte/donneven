import { describe, expect, it } from "vitest";
import { busyDays, isRangeFree, overlaps } from "@/lib/availability";

const r = (a: string, b: string) => ({ startAt: new Date(a), endAt: new Date(b) });

describe("disponibilités", () => {
  it("détecte les chevauchements", () => {
    expect(overlaps(r("2026-11-01T10:00Z", "2026-11-03T10:00Z"), r("2026-11-02T10:00Z", "2026-11-05T10:00Z"))).toBe(true);
  });
  it("autorise un départ à l'heure exacte du retour précédent", () => {
    expect(overlaps(r("2026-11-01T10:00Z", "2026-11-03T10:00Z"), r("2026-11-03T10:00Z", "2026-11-05T10:00Z"))).toBe(false);
  });
  it("vérifie une plage contre plusieurs réservations", () => {
    const taken = [r("2026-11-01T10:00Z", "2026-11-03T10:00Z"), r("2026-11-10T10:00Z", "2026-11-12T10:00Z")];
    expect(isRangeFree(r("2026-11-04T10:00Z", "2026-11-09T10:00Z"), taken)).toBe(true);
    expect(isRangeFree(r("2026-11-04T10:00Z", "2026-11-11T10:00Z"), taken)).toBe(false);
  });
  it("liste les jours occupés dans le fuseau local", () => {
    // 22 h en Guadeloupe = 02 h UTC le lendemain : le jour local doit rester le 1er
    const days = busyDays([r("2026-11-01T22:00:00-04:00", "2026-11-03T08:00:00-04:00")], "America/Guadeloupe");
    expect([...days].sort()).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
  });
});

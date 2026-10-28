import { describe, expect, it } from "vitest";
import { TERRITORIES, blurPosition, distanceKm, findCommune } from "@/lib/territories";
import { zonedDate, dayInZone } from "@/lib/dates";
import { parseSearchParams } from "@/lib/search-params";

describe("territoires", () => {
  it("couvre les 5 territoires avec un aéroport chacun", () => {
    expect(TERRITORIES.map((t) => t.code).sort()).toEqual(["971", "972", "973", "977", "978"]);
    for (const t of TERRITORIES) expect(t.hubs.some((h) => h.kind === "AEROPORT")).toBe(true);
  });
  it("place chaque commune près du centre de son territoire", () => {
    for (const t of TERRITORIES) for (const c of t.communes) expect(distanceKm(t.center, [c.lat, c.lng])).toBeLessThan(260);
  });
  it("signale les communes guyanaises sans accès routier", () => {
    expect(findCommune("guyane", "Maripasoula")?.roadAccess).toBe(false);
    expect(findCommune("guyane", "Kourou")?.roadAccess).toBeUndefined();
  });
  it("floute la position de façon stable et limitée", () => {
    const a = blurPosition(16.24, -61.53, "abc");
    expect(blurPosition(16.24, -61.53, "abc")).toEqual(a);
    expect(distanceKm([16.24, -61.53], a)).toBeLessThan(0.7);
  });
});

describe("fuseaux horaires", () => {
  it("UTC-4 aux Antilles, UTC-3 en Guyane", () => {
    expect(zonedDate("martinique", "2026-11-02", "10:00")?.toISOString()).toBe("2026-11-02T14:00:00.000Z");
    expect(zonedDate("guyane", "2026-11-02", "10:00")?.toISOString()).toBe("2026-11-02T13:00:00.000Z");
    expect(zonedDate("guyane", "pas-une-date")).toBeNull();
  });
  it("donne le jour local", () => {
    expect(dayInZone(new Date("2026-11-02T02:00:00Z"), "guadeloupe")).toBe("2026-11-01");
  });
});

describe("paramètres de recherche", () => {
  it("interprète lieu=h:AEROPORT comme une livraison aéroport", () => {
    const f = parseSearchParams({ territoire: "guyane", lieu: "h:AEROPORT", debut: "2026-11-02", fin: "2026-11-05" });
    expect(f.delivery).toBe("AEROPORT");
    expect(f.commune).toBeUndefined();
    expect(f.endAt!.getTime() - f.startAt!.getTime()).toBe(3 * 864e5);
  });
  it("ignore les valeurs invalides", () => {
    const f = parseSearchParams({ territoire: "paris", lieu: "c:Atlantis", categorie: "FUSEE", prixMax: "-3" });
    expect(f.territory).toBe("guadeloupe");
    expect(f.commune).toBeUndefined();
    expect(f.category).toBeUndefined();
    expect(f.maxPrice).toBeUndefined();
  });
  it("ignore une date de retour antérieure au départ", () => {
    const f = parseSearchParams({ debut: "2026-11-05", fin: "2026-11-02" });
    expect(f.startAt).toBeNull();
  });
});

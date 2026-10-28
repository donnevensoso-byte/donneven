import { describe, expect, it } from "vitest";
import { parseListingForm } from "@/lib/services/listings";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const valid = {
  title: "Débroussailleuse Stihl",
  description: "Débroussailleuse thermique en très bon état avec harnais.",
  category: "jardin",
  condition: "tres_bon",
  dayPrice: "25",
  weekPrice: "120",
  deposit: "200,50",
  minDays: "1",
  commune: "matoury",
};

describe("parseListingForm", () => {
  it("convertit un formulaire valide", () => {
    const res = parseListingForm(form(valid));
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toMatchObject({ dayPrice: 2500, weekPrice: 12000, deposit: 20050, brand: null, delivery: false, lat: null });
    }
  });

  it("signale les champs manquants ou invalides", () => {
    const res = parseListingForm(form({ ...valid, title: "Abc", dayPrice: "", commune: "paris" }));
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(Object.keys(res.fieldErrors).sort()).toEqual(["commune", "dayPrice", "title"]);
    }
  });

  it("refuse un prix semaine supérieur à 7 jours", () => {
    const res = parseListingForm(form({ ...valid, weekPrice: "200" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.fieldErrors.weekPrice).toMatch(/inférieur/);
  });
});

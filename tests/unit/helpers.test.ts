import { afterEach, describe, expect, it } from "vitest";
import { addDays, endOfDayInGuyane, isIsoDate, periodsOverlap, rentalDays, todayInGuyane } from "@/lib/dates";
import { formatEuros, parseEuros } from "@/lib/money";
import { normalizeText, publicName, whatsappNumber } from "@/lib/text";

describe("dates", () => {
  it("calcule la date du jour à l'heure de Guyane (UTC−3)", () => {
    expect(todayInGuyane(new Date("2026-03-01T02:30:00Z"))).toBe("2026-02-28");
    expect(todayInGuyane(new Date("2026-03-01T03:30:00Z"))).toBe("2026-03-01");
  });
  it("compte les jours bornes incluses", () => {
    expect(rentalDays("2026-05-03", "2026-05-05")).toBe(3);
    expect(rentalDays("2026-05-03", "2026-05-03")).toBe(1);
  });
  it("détecte les chevauchements", () => {
    expect(periodsOverlap("2026-05-01", "2026-05-03", "2026-05-03", "2026-05-06")).toBe(true);
    expect(periodsOverlap("2026-05-01", "2026-05-02", "2026-05-03", "2026-05-06")).toBe(false);
  });
  it("valide et décale les dates", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(endOfDayInGuyane("2026-05-03").toISOString()).toBe("2026-05-04T03:00:00.000Z");
  });
});

describe("argent", () => {
  it("convertit les saisies en centimes", () => {
    expect(parseEuros("12,50")).toBe(1250);
    expect(parseEuros(" 15 € ")).toBe(1500);
    expect(parseEuros("1.5")).toBe(150);
    expect(parseEuros("abc")).toBeNull();
    expect(parseEuros("-3")).toBeNull();
  });
  it("formate en euros", () => {
    expect(formatEuros(1200).replace(/\s/g, " ")).toBe("12 €");
    expect(formatEuros(1250).replace(/\s/g, " ")).toBe("12,50 €");
  });
});

describe("texte", () => {
  it("normalise pour la recherche", () => {
    expect(normalizeText("  Débroussailleuse   STIHL ")).toBe("debroussailleuse stihl");
  });
  it("affiche un nom public discret", () => {
    expect(publicName("Marie-Laure Désiré")).toBe("Marie-Laure D.");
    expect(publicName("Kévin")).toBe("Kévin");
  });
  it("convertit les numéros pour WhatsApp", () => {
    expect(whatsappNumber("0694 12 34 56")).toBe("594694123456");
    expect(whatsappNumber("06 12 34 56 78")).toBe("33612345678");
    expect(whatsappNumber("+594 694 12 34 56")).toBe("594694123456");
    expect(whatsappNumber("123")).toBeNull();
  });
});

describe("redirections", () => {
  it("n'accepte que les chemins internes", async () => {
    const { safeRedirectPath } = await import("@/lib/text");
    expect(safeRedirectPath("/annonces/abc")).toBe("/annonces/abc");
    expect(safeRedirectPath("//evil.example")).toBe("/compte");
    expect(safeRedirectPath("/\\evil.example")).toBe("/compte");
    expect(safeRedirectPath("https://evil.example")).toBe("/compte");
    expect(safeRedirectPath(undefined)).toBe("/compte");
  });
});

describe("appUrl", () => {
  const saved = process.env.APP_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = saved;
  });

  it("ajoute https:// quand l'adresse est saisie sans protocole (erreur 500 en production sinon)", async () => {
    const { appUrl } = await import("@/lib/config");
    process.env.APP_URL = " zouti97.fr/ ";
    expect(appUrl()).toBe("https://zouti97.fr");
    expect(() => new URL(appUrl())).not.toThrow();
  });

  it("garde une adresse complète et retire la barre finale", async () => {
    const { appUrl } = await import("@/lib/config");
    process.env.APP_URL = "https://zouti97.fr/";
    expect(appUrl()).toBe("https://zouti97.fr");
    process.env.APP_URL = "http://localhost:3000";
    expect(appUrl()).toBe("http://localhost:3000");
  });
});

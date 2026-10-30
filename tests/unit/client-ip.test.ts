import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/rate-limit";

const h = (values: Record<string, string>) => new Headers(values);

describe("clientIp", () => {
  it("prend l'adresse ajoutée par le proxy, pas celle écrite par le client", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }), 1)).toBe("203.0.113.7");
  });

  it("remonte d'autant de proxys que configuré", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.2" }), 2)).toBe("203.0.113.7");
  });

  it("chaîne plus courte que le nombre de proxys : première adresse", () => {
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.7" }), 2)).toBe("203.0.113.7");
  });

  it("sans en-tête : x-real-ip, sinon une clé commune", () => {
    expect(clientIp(h({ "x-real-ip": "198.51.100.4" }), 1)).toBe("198.51.100.4");
    expect(clientIp(h({}), 1)).toBe("local");
  });
});

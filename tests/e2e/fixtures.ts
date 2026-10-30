// Outils communs aux specs e2e : garde-fous (erreurs console, réponses 5xx),
// scan d'accessibilité axe, et comptes / annonces créés directement en base
// pour ne pas dépendre des limites anti-abus de l'inscription.
import { readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { db } from "../../src/lib/db";
import { sessions, users } from "../../src/lib/db/schema";
import { newId, newToken, sha256 } from "../../src/lib/ids";
import { hashPassword } from "../../src/lib/password";
import { createListing, listingFormSchema } from "../../src/lib/services/listings";

export { expect };

export const PASSWORD = "motdepasse-e2e";
let passwordHash: string | undefined;
let counter = 0;

export type TestUser = { id: string; email: string; name: string; token: string };

/** Crée un membre vérifié et une session valide (cookie à poser avec `signIn`). */
export async function createUser(name = "Membre Test", commune = "cayenne", extra: { phone?: string; role?: "admin" } = {}): Promise<TestUser> {
  passwordHash ??= await hashPassword(PASSWORD);
  const id = newId();
  const email = `u${Date.now()}-${++counter}-${Math.random().toString(36).slice(2, 6)}@test.gf`;
  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name,
    commune,
    phone: extra.phone ?? null,
    role: extra.role ?? "user",
    emailVerifiedAt: new Date(),
  });
  const token = newToken();
  await db.insert(sessions).values({ id: sha256(token), userId: id, expiresAt: new Date(Date.now() + 86_400_000) });
  return { id, email, name, token };
}

export async function signIn(context: BrowserContext, user: TestUser) {
  await context.clearCookies();
  const url = new URL(test.info().project.use.baseURL!);
  await context.addCookies([{ name: "zouti_session", value: user.token, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" }]);
}

/** Second navigateur (autre membre), avec les mêmes garde-fous. */
export async function openAs(browser: Browser, user: TestUser): Promise<{ page: Page; close: () => Promise<void> }> {
  const project = test.info().project.use;
  const context = await browser.newContext({ ...project, baseURL: project.baseURL });
  await signIn(context, user);
  const page = await context.newPage();
  guard(page);
  return { page, close: () => context.close() };
}

export async function createTestListing(ownerId: string, overrides: Partial<Record<string, string>> = {}): Promise<string> {
  const input = listingFormSchema.parse({
    title: "Perceuse à percussion Bosch",
    description: "Perceuse 750 W avec coffret de forets béton et bois, en très bon état.",
    category: "bricolage",
    brand: "",
    condition: "tres_bon",
    dayPrice: "10",
    weekPrice: "",
    deposit: "80",
    minDays: "1",
    commune: "cayenne",
    neighborhood: "",
    pickupNotes: "",
    ...overrides,
  });
  const photo = await readFile(path.join(process.cwd(), "scripts/seed-images/perfo.jpg"));
  return createListing(ownerId, input, [photo]);
}

/** Petite image PNG valide (4×3 px). */
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWPgzvOHIwacHACzxwlhp8JiaQAAAABJRU5ErkJggg==",
  "base64",
);

const problems = new WeakMap<Page, string[]>();

/** Note toute erreur console et toute réponse 5xx ; vérifié en fin de test. */
export function guard(page: Page) {
  const list: string[] = [];
  problems.set(page, list);
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Tuiles de carte externes : bloquées hors ligne, sans rapport avec l'app.
    if (/tile\.openstreetmap|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|net::ERR_/.test(text)) return;
    list.push(`console: ${text}`);
  });
  page.on("pageerror", (err) => list.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 500) list.push(`${res.status()} ${res.url()}`);
  });
}

/** Pour un 404 attendu (page d'un autre membre) : le navigateur le note aussi en console. */
export function allowNotFound(page: Page) {
  const list = problems.get(page);
  if (list) list.splice(0, list.length, ...list.filter((p) => !p.includes("status of 404")));
}

export function problemsOf(page: Page): string[] {
  return problems.get(page) ?? [];
}

/** Scan axe (WCAG 2.1 A/AA) de l'écran courant. Retourne les violations, triées. */
export async function axe(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude(".leaflet-container").analyze();
  return result.violations.map((v) => `${v.id} (${v.impact}) ×${v.nodes.length} : ${v.nodes[0]?.target.join(" ")}`);
}

export async function expectAccessible(page: Page) {
  expect(await axe(page), `axe sur ${page.url()}`).toEqual([]);
}

export const test = base.extend<{ autoGuard: void }>({
  autoGuard: [
    async ({ page }, use) => {
      guard(page);
      await use();
      expect(problemsOf(page), "erreurs console ou réponses 5xx").toEqual([]);
    },
    { auto: true },
  ],
});

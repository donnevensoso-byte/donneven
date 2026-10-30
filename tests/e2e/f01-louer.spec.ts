// F01 Le locataire loue un outil : cas limites et négatifs.
// Le chemin heureux complet est dans rental-flow.spec.ts (F01-H1 + F03-H1).
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { bookings, conversations } from "../../src/lib/db/schema";
import { addDays, todayInGuyane } from "../../src/lib/dates";
import { requestBooking, respondToBooking } from "../../src/lib/services/bookings";
import { allowNotFound, createTestListing, createUser, expect, expectAccessible, openAs, PASSWORD, signIn, test } from "./fixtures";

const day = (n: number) => addDays(todayInGuyane(), n);

async function fillDates(page: import("@playwright/test").Page, start: string, end: string) {
  await page.getByLabel("Début").fill(start);
  await page.getByLabel("Fin (incluse)").fill(end);
}

test("F01-E1 recherche sans résultat : état vide utile", async ({ page }) => {
  await page.goto("/recherche?q=xylophone-introuvable-zz");
  await expect(page.getByText("Aucune annonce ne correspond")).toBeVisible();
  await expect(page.getByRole("link", { name: "Proposer ce matériel" })).toBeVisible();
  await expectAccessible(page);
});

test("F01-E2 recherche avec accents et emoji", async ({ page }) => {
  const owner = await createUser("Propriétaire Accent");
  await createTestListing(owner.id, { title: "Débroussailleuse Échelle 🌿 spéciale" });
  await page.goto(`/recherche?q=${encodeURIComponent("débroussailleuse échelle")}`);
  await expect(page.getByTestId("listing-card").filter({ hasText: "Débroussailleuse Échelle 🌿" })).toBeVisible();
  await page.goto(`/recherche?q=${encodeURIComponent("🌿")}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("F01-E3 deux onglets envoient la même demande : une seule réservation", async ({ page, browser, context }) => {
  const owner = await createUser("Propriétaire Onglets");
  const renter = await createUser("Locataire Onglets");
  const listingId = await createTestListing(owner.id);
  await signIn(context, renter);
  const other = await openAs(browser, renter);
  for (const p of [page, other.page]) {
    await p.goto(`/annonces/${listingId}`);
    await fillDates(p, day(3), day(4));
  }
  await Promise.all([
    page.getByRole("button", { name: "Demander à réserver" }).click(),
    other.page.getByRole("button", { name: "Demander à réserver" }).click(),
  ]);
  await page.waitForTimeout(1500);
  await other.close();
  const rows = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.listingId, listingId));
  expect(rows).toHaveLength(1);
  const convs = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.listingId, listingId));
  expect(convs).toHaveLength(1);
});

test("F01-E4 double clic sur « Demander à réserver » : une seule réservation", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Clic");
  const renter = await createUser("Locataire Clic");
  const listingId = await createTestListing(owner.id);
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  await fillDates(page, day(3), day(4));
  await page.getByRole("button", { name: "Demander à réserver" }).dblclick();
  await expect(page.getByText("Demande envoyée")).toBeVisible();
  const rows = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.listingId, listingId));
  expect(rows).toHaveLength(1);
});

test("F01-E5 dates déjà réservées : refus clair, pas de demande", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Occupé");
  const first = await createUser("Premier Locataire");
  const renter = await createUser("Second Locataire");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(first.id, { listingId, startDate: day(5), endDate: day(6) });
  await respondToBooking(owner.id, id, "accept");
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  await fillDates(page, day(6), day(7));
  await page.getByRole("button", { name: "Demander à réserver" }).click();
  await expect(page.getByText(/pas disponible à ces dates/)).toBeVisible();
  const rows = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.renterId, renter.id));
  expect(rows).toHaveLength(0);
});

test("F01-E6 message long avec accents et emoji conservé tel quel", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Message");
  const renter = await createUser("Locataire Message");
  const listingId = await createTestListing(owner.id);
  const message = `Bonjour Maëlle ! 🙂 C'est pour le carbet à Rémire-Montjoly, on démarre tôt. ${"Très long détail. ".repeat(40)}Fin.`;
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  await fillDates(page, day(3), day(3));
  await page.getByLabel("Message au propriétaire").fill(message);
  await page.getByRole("button", { name: "Demander à réserver" }).click();
  await expect(page.getByText("Demande envoyée")).toBeVisible();
  await page.goto("/messages");
  await page.getByTestId("conversation-row").first().click();
  await expect(page.getByTestId("thread")).toContainText("Bonjour Maëlle ! 🙂 C'est pour le carbet à Rémire-Montjoly");
  await expect(page.getByTestId("thread")).toContainText("Fin.");
  await expectAccessible(page);
});

test("F01-E7 la réservation d'un autre membre est invisible", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Privé");
  const renter = await createUser("Locataire Privé");
  const stranger = await createUser("Curieux");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(3), endDate: day(4), message: "secret-123" });
  await respondToBooking(owner.id, id, "accept");

  await signIn(context, stranger);
  expect((await page.goto(`/reservations/${id}`))?.status()).toBe(404);
  expect((await page.goto(`/reservations/${id}/contrat`))?.status()).toBe(404);
  allowNotFound(page);
  await page.goto("/messages");
  await expect(page.getByText("secret-123")).toHaveCount(0);

  await context.clearCookies();
  await page.goto(`/reservations/${id}`);
  await expect(page).toHaveURL(/\/connexion\?next=/);
});

test("F01-E8 session expirée : retour à la page après reconnexion", async ({ page, context }) => {
  const renter = await createUser("Locataire Expiré");
  const owner = await createUser("Propriétaire Expiré");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(3), endDate: day(4) });
  await signIn(context, { ...renter, token: "jeton-invalide" });
  await page.goto(`/reservations/${id}`);
  await expect(page).toHaveURL(/\/connexion\?next=/);
  await page.getByLabel("Adresse e-mail").fill(renter.email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(new RegExp(`/reservations/${id}$`));
});

test("F01-E9 au clavier seulement : choisir les dates et envoyer", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Clavier");
  const renter = await createUser("Locataire Clavier");
  const listingId = await createTestListing(owner.id);
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  await page.getByLabel("Début").focus();
  await fillDates(page, day(3), day(4));
  const button = page.getByRole("button", { name: "Demander à réserver" });
  for (let i = 0; i < 15 && !(await button.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Demande envoyée")).toBeVisible();
  await expectAccessible(page);
});

test("F01-N1 louer son propre matériel est impossible", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Seul");
  const listingId = await createTestListing(owner.id);
  await signIn(context, owner);
  await page.goto(`/annonces/${listingId}`);
  await expect(page.getByRole("button", { name: "Demander à réserver" })).toHaveCount(0);
  await expectAccessible(page);
});

test("F01-N2 mauvais mot de passe : message, pas de connexion", async ({ page }) => {
  const user = await createUser("Membre Oublieux");
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(user.email);
  await page.getByLabel("Mot de passe").fill("pas-le-bon-mot");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText(/incorrect/i)).toBeVisible();
  await expect(page).toHaveURL(/\/connexion/);
  await expectAccessible(page);
});

test("F01-N3 date de début passée refusée par le serveur", async ({ page, context }) => {
  const owner = await createUser("Propriétaire Passé");
  const renter = await createUser("Locataire Passé");
  const listingId = await createTestListing(owner.id);
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  // Contourne le min du champ date comme le ferait un navigateur ancien.
  await page.getByLabel("Début").evaluate((el: HTMLInputElement) => el.removeAttribute("min"));
  await page.getByLabel("Fin (incluse)").evaluate((el: HTMLInputElement) => el.removeAttribute("min"));
  await fillDates(page, day(-2), day(-1));
  await page.getByRole("button", { name: "Demander à réserver" }).click();
  await expect(page.getByText(/déjà passée/)).toBeVisible();
});

test("F01-E14 pages locales : commune, catégorie, combinaison, et 404 sur un lieu inconnu", async ({ page }) => {
  const owner = await createUser("Loueuse Kourou", "kourou");
  const marker = `Locale${Date.now()}`;
  await createTestListing(owner.id, { title: `Taille-haie ${marker}`, category: "jardin", commune: "kourou" });
  await page.goto("/location-outils");
  await page.getByRole("link", { name: /^Kourou \(/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Location d'outils à Kourou");
  await expect(page.getByTestId("listing-card").filter({ hasText: marker })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("link", { name: /Jardin & débroussaillage \(/ }).click();
  await expect(page).toHaveURL(/\/location-outils\/jardin\/kourou$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Location jardin & débroussaillage à Kourou");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/location-outils\/jardin\/kourou$/);
  const res = await page.goto("/location-outils/atlantide");
  expect(res?.status()).toBe(404);
  allowNotFound(page);
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/location-outils/jardin/kourou");
});

test("F01-E15 délai de prévenance, heures souhaitées et rayon de recherche", async ({ page, context }) => {
  const owner = await createUser("Loueur Prévenance");
  const renter = await createUser("Locataire Horaires");
  const marker = `Horaire${Date.now()}`;
  const listingId = await createTestListing(owner.id, { title: `Échafaudage ${marker}`, minNoticeDays: "3", commune: "remire-montjoly" });
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  await expect(page.getByText(/prévenu 3 jours à l'avance/)).toBeVisible();
  await expect(page.getByLabel("Début")).toHaveAttribute("min", day(3));
  await fillDates(page, day(3), day(4));
  await page.getByLabel(/Heure de remise/).fill("07:30");
  await page.getByLabel(/Heure de retour/).fill("17:45");
  await page.getByRole("button", { name: "Demander à réserver" }).click();
  await expect(page.getByText("Demande envoyée")).toBeVisible();
  await expect(page.getByText("remise 07:30 · retour 17:45")).toBeVisible();

  await page.goto(`/recherche?q=${marker}&commune=cayenne`);
  await expect(page.getByTestId("listing-card")).toHaveCount(0);
  await page.goto(`/recherche?q=${marker}&commune=cayenne&rayon=20`);
  await expect(page.getByTestId("listing-card")).toHaveCount(1);
  await expect(page.getByLabel("Autour de la commune")).toHaveValue("20");
});

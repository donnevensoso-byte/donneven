import { expect, test, type Page } from "@playwright/test";
import { addDays, todayInGuyane } from "../../src/lib/dates";

// Petite image PNG valide (4×3 px verte) pour la photo de l'annonce.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWPgzvOHIwacHACzxwlhp8JiaQAAAABJRU5ErkJggg==",
  "base64",
);
const run = Date.now();
const owner = { name: "Marie-Laure Désiré", email: `owner-${run}@test.gf`, password: "motdepasse-owner" };
const renter = { name: "Kévin Ho-A-Sim", email: `renter-${run}@test.gf`, password: "motdepasse-renter" };

async function signup(page: Page, user: typeof owner, commune: string) {
  await page.goto("/inscription");
  await page.getByLabel("Prénom et nom").fill(user.name);
  await page.getByLabel("Adresse e-mail").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByLabel("Votre commune").selectOption(commune);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/compte$/);
}

async function login(page: Page, user: typeof owner) {
  await page.context().clearCookies();
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/compte$/);
}

test("parcours complet d'une location entre particuliers", async ({ page, browser }) => {
  page.on("dialog", (dialog) => dialog.accept());
  const start = addDays(todayInGuyane(), 1);
  const end = addDays(todayInGuyane(), 3);

  // 1. La propriétaire s'inscrit et publie une annonce
  await signup(page, owner, "matoury");
  await page.goto("/annonces/nouvelle");
  await page.getByTestId("photo-picker").setInputFiles({ name: "karcher.png", mimeType: "image/png", buffer: PNG });
  await expect(page.locator('img[src^="blob:"]')).toHaveCount(1);
  await page.getByLabel("Titre de l'annonce").fill("Nettoyeur haute pression Kärcher K5");
  await page.getByLabel("Catégorie").selectOption("nettoyage");
  await page.getByLabel("État").selectOption("tres_bon");
  await page.getByLabel("Description").fill("Parfait pour les terrasses et les murs moisis. Rotabuse et rallonge fournies.");
  await page.getByLabel("Prix par jour (€)").fill("20");
  await page.getByLabel("Caution (€)").fill("150");
  await page.getByRole("button", { name: "Publier l'annonce" }).click();
  await expect(page.getByText("Votre annonce est en ligne")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nettoyeur haute pression Kärcher K5" })).toBeVisible();
  const listingUrl = page.url().split("?")[0];

  // 2. Le locataire s'inscrit, trouve l'annonce et envoie une demande
  await page.context().clearCookies();
  await signup(page, renter, "cayenne");
  await page.goto("/recherche?q=karcher");
  await page.getByTestId("listing-card").first().click();
  await expect(page).toHaveURL(listingUrl);
  await page.getByLabel("Début").fill(start);
  await page.getByLabel("Fin (incluse)").fill(end);
  await expect(page.getByTestId("price-breakdown")).toContainText("60");
  await page.getByLabel("Message au propriétaire").fill("Bonjour, c'est pour nettoyer ma terrasse à Cayenne !");
  await page.getByRole("button", { name: "Demander à réserver" }).click();
  await expect(page.getByText("Demande envoyée")).toBeVisible();
  const bookingUrl = page.url().split("?")[0];

  // 3. La propriétaire accepte et répond par message
  await login(page, owner);
  await page.goto("/reservations?vue=recues");
  await page.getByTestId("booking-row").first().click();
  await expect(page).toHaveURL(bookingUrl);
  await page.getByRole("button", { name: /Accepter la demande/ }).click();
  await expect(page.getByLabel("Code de remise du locataire")).toBeVisible();
  await page.goto("/messages");
  await page.getByTestId("conversation-row").first().click();
  await expect(page.getByTestId("thread")).toContainText("nettoyer ma terrasse");
  await page.getByLabel("Votre message").fill("Avec plaisir ! Rendez-vous demain 17 h à Matoury.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByTestId("thread")).toContainText("Rendez-vous demain 17 h");

  // 4. Le locataire montre son code de remise, la propriétaire le saisit
  const renterContext = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "fr-FR", timezoneId: "America/Cayenne" });
  const renterPage = await renterContext.newPage();
  await login(renterPage, renter);
  await renterPage.goto(bookingUrl);
  const code = (await renterPage.getByTestId("handover-code").locator("p").nth(1).textContent())?.trim() ?? "";
  expect(code).toMatch(/^\d{4}$/);
  await renterContext.close();

  await page.goto(bookingUrl);
  await expect(page.getByText("Confirmée", { exact: true }).first()).toBeVisible();
  // État des lieux en photos avant la remise
  await page.getByTestId("photo-picker").setInputFiles({ name: "etat.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Remarque").fill("Petite rayure sur le capot");
  await page.getByRole("button", { name: /Ajouter à l'état des lieux/ }).click();
  await expect(page.getByTestId("photos-handover").locator("li")).toHaveCount(1);
  await page.getByLabel("Code de remise du locataire").fill(code === "0000" ? "1111" : "0000");
  await page.getByRole("button", { name: /Confirmer la remise/ }).click();
  await expect(page.getByText(/Code incorrect/)).toBeVisible();
  await page.getByLabel("Code de remise du locataire").fill(code);
  await page.getByRole("button", { name: /Confirmer la remise/ }).click();
  await expect(page.getByText("En cours", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Le matériel m'a été rendu/ }).click();
  await expect(page.getByText("Terminée", { exact: true })).toBeVisible();
  await page.locator("label[title='5 étoiles']").click();
  await page.getByLabel("Votre avis").fill("Locataire ponctuel, matériel rendu propre. Merci !");
  await page.getByRole("button", { name: "Publier mon avis" }).click();
  await expect(page.getByText(/Vous avez laissé 5 ★/)).toBeVisible();

  // 5. Le locataire voit la réponse, le contrat et laisse son avis
  await login(page, renter);
  await page.goto("/messages");
  await page.getByTestId("conversation-row").first().click();
  await expect(page.getByTestId("thread")).toContainText("Rendez-vous demain 17 h");
  await page.goto(`${bookingUrl}/contrat`);
  await expect(page.getByRole("heading", { name: /Contrat de location/ })).toBeVisible();
  await expect(page.getByText(owner.name)).toBeVisible();
  await page.goto(bookingUrl);
  await expect(page.getByText(/vous a laissé 5 ★/)).toBeVisible();
  await page.locator("label[title='4 étoiles']").click();
  await page.getByLabel("Votre avis").fill("Kärcher très efficace, propriétaire arrangeante.");
  await page.getByRole("button", { name: "Publier mon avis" }).click();
  await expect(page.getByText(/Vous avez laissé 4 ★/)).toBeVisible();

  // 6. L'avis apparaît sur l'annonce
  await page.goto(listingUrl);
  await expect(page.getByText("Kärcher très efficace")).toBeVisible();
});

test("les pages publiques et légales répondent", async ({ page }) => {
  for (const path of ["/", "/recherche", "/comment-ca-marche", "/faq", "/confiance", "/cgu", "/confidentialite", "/mentions-legales"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
  }
  const missing = await page.goto("/annonces/inexistante");
  expect(missing?.status()).toBe(404);
  const health = await page.request.get("/api/health");
  expect(await health.json()).toEqual({ ok: true });
});

// F06 Le loueur retire son argent (Stripe Express, désactivé en local)
// F07 Litige : signalement d'un membre ou d'une annonce, ou litige déclaré depuis la réservation.
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { bookings } from "../../src/lib/db/schema";
import { addDays, todayInGuyane } from "../../src/lib/dates";
import { confirmHandover, requestBooking, respondToBooking } from "../../src/lib/services/bookings";
import { allowNotFound, createTestListing, createUser, expect, expectAccessible, openAs, signIn, test } from "./fixtures";

test("F06-H1 sans Stripe : la page paiements explique le règlement en main propre", async ({ page, context }) => {
  const owner = await createUser("Loueur Paiements");
  await signIn(context, owner);
  await page.goto("/compte/paiements");
  await expect(page.getByText(/se règlent en main propre/)).toBeVisible();
  await expectAccessible(page);
});

test("F06-E1 espace compte accessible (liens repérables sans la couleur)", async ({ page, context }) => {
  const user = await createUser("Membre Compte");
  await signIn(context, user);
  await page.goto("/compte");
  await expectAccessible(page);
});

test("F07-H1 signaler une annonce puis l'équipe la traite", async ({ page, context, browser }) => {
  const owner = await createUser("Loueur Signalé");
  const renter = await createUser("Locataire Vigilant");
  const admin = await createUser("Équipe Zouti", "cayenne", { role: "admin" });
  const listingId = await createTestListing(owner.id, { title: "Tronçonneuse douteuse signalée" });
  await signIn(context, renter);
  await page.goto(`/annonces/${listingId}`);
  await page.getByRole("button", { name: /Signaler cette annonce/ }).click();
  await page.getByLabel("Motif").selectOption({ index: 1 });
  await page.getByLabel("Précisions").fill("Photo prise sur internet, le vendeur demande un virement.");
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByRole("status").or(page.getByRole("alert")).first()).toBeVisible();

  const a = await openAs(browser, admin);
  await a.page.goto("/admin");
  await expect(a.page.getByText("Photo prise sur internet")).toBeVisible();
  await expectAccessible(a.page);
  await a.page.getByRole("button", { name: "Marquer traité" }).first().click();
  await expect(a.page.getByRole("listitem").filter({ hasText: "Photo prise sur internet" }).getByText("Traité", { exact: true })).toBeVisible();
  await a.close();
});

test("F07-E1 signaler un membre depuis son profil", async ({ page, context }) => {
  const target = await createUser("Membre Signalé");
  const reporter = await createUser("Membre Témoin");
  await signIn(context, reporter);
  await page.goto(`/profil/${target.id}`);
  await page.getByRole("button", { name: /Signaler ce membre/ }).click();
  await page.getByLabel("Motif").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByRole("status").or(page.getByRole("alert")).first()).toBeVisible();
});

test("F07-N1 un membre ordinaire n'accède pas à l'administration", async ({ page, context }) => {
  const user = await createUser("Membre Ordinaire");
  await signIn(context, user);
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin/);
  allowNotFound(page);
});

test("F07-H2 litige déclaré depuis la réservation, arbitré par l'équipe avec le contrat", async ({ page, context, browser }) => {
  const owner = await createUser("Loueur Litige");
  const renter = await createUser("Locataire Litige");
  const admin = await createUser("Équipe Arbitrage", "cayenne", { role: "admin" });
  const listingId = await createTestListing(owner.id, { title: "Nettoyeur haute pression litige" });
  const id = await requestBooking(renter.id, { listingId, startDate: todayInGuyane(), endDate: addDays(todayInGuyane(), 1) });
  await respondToBooking(owner.id, id, "accept");
  const [{ handoverCode }] = await db.select().from(bookings).where(eq(bookings.id, id));
  await confirmHandover(owner.id, id, handoverCode!);

  await signIn(context, owner);
  await page.goto(`/reservations/${id}`);
  await page.getByRole("button", { name: /Signaler un problème sur cette location/ }).click();
  await page.getByLabel("Motif").selectOption("Matériel endommagé");
  await page.getByLabel("Que s'est-il passé ?").fill("Lance cassée au retour, raccord fendu.");
  await page.getByRole("button", { name: "Envoyer à l'équipe Zouti" }).click();
  // La page se met à jour : le formulaire laisse place à l'état du litige.
  await expect(page.getByText(/Litige ouvert le/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Signaler un problème/ })).toHaveCount(0);
  await expectAccessible(page);

  const r = await openAs(browser, renter);
  await r.page.goto(`/reservations/${id}`);
  await expect(r.page.getByText(/Litige ouvert le/)).toBeVisible();
  await r.close();

  const a = await openAs(browser, admin);
  await a.page.goto("/admin");
  await expect(a.page.getByText("Lance cassée au retour")).toBeVisible();
  await a.page.getByRole("link", { name: "Litige : contrat et photos" }).first().click();
  await expect(a.page.getByRole("heading", { name: /Contrat de location/ })).toBeVisible();
  await expect(a.page.getByText("Loueur Litige", { exact: true })).toBeVisible();
  await a.close();
});

test("pages légales : identité de l'éditeur et prestataires lus depuis la configuration, plus de champ vide", async ({ page }) => {
  for (const path of ["/mentions-legales", "/cgu", "/confidentialite"]) {
    await page.goto(path);
    await expect(page.locator("mark")).toHaveCount(0);
  }
  await page.goto("/mentions-legales");
  await expect(page.getByText("Prénom Test EI").first()).toBeVisible();
  await expect(page.getByText(/Render Services, Inc\./)).toBeVisible();
  await expect(page.getByText(/TVA non applicable/)).toBeVisible();
  await page.goto("/confidentialite");
  await expect(page.getByText(/Brevo/)).toBeVisible();
  await expect(page.getByRole("link", { name: "bonjour@zouti-test.fr" }).first()).toBeVisible();
  await page.goto("/cgu");
  await expect(page.getByText(/Médiateur Test/)).toBeVisible();
});

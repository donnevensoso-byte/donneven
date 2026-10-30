// F02 Le loueur publie un outil.
import { allowNotFound, createTestListing, createUser, expect, expectAccessible, PNG, signIn, test } from "./fixtures";

test("F02-H1 publier une annonce avec accents et emoji", async ({ page, context }) => {
  const owner = await createUser("Loueuse Publication", "kourou");
  await signIn(context, owner);
  await page.goto("/annonces/nouvelle");
  await expectAccessible(page);
  await page.getByTestId("photo-picker").setInputFiles({ name: "outil.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Titre de l'annonce").fill("Scie sauteuse Makita – idéale carbet 🪚");
  await page.getByLabel("Catégorie").selectOption("bricolage");
  await page.getByLabel("État").selectOption("bon");
  await page.getByLabel("Description").fill("Scie sauteuse 720 W, lames bois et métal fournies. Prévoir rallonge si besoin.");
  await page.getByLabel("Prix par jour (€)").fill("8,50");
  await page.getByLabel("Caution (€)").fill("60");
  await page.getByRole("button", { name: "Publier l'annonce" }).click();
  await expect(page.getByText("Votre annonce est en ligne")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scie sauteuse Makita – idéale carbet 🪚" })).toBeVisible();
  await expect(page.getByText(/8,50\s€/).first()).toBeVisible();
  await expectAccessible(page);
});

test("F02-E1 formulaire vide : erreurs par champ, reliées aux champs", async ({ page, context }) => {
  const owner = await createUser("Loueur Pressé");
  await signIn(context, owner);
  await page.goto("/annonces/nouvelle");
  await page.getByRole("button", { name: "Publier l'annonce" }).click();
  await expect(page.getByLabel("Titre de l'annonce")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Prix par jour (€)")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#title-error")).toBeVisible();
  await expect(page).toHaveURL(/\/annonces\/nouvelle/);
  await expectAccessible(page);
});

test("F02-E2 sans photo : refus explicite, champs conservés", async ({ page, context }) => {
  const owner = await createUser("Loueur Sans Photo");
  await signIn(context, owner);
  await page.goto("/annonces/nouvelle");
  await page.getByLabel("Titre de l'annonce").fill("Ponceuse orbitale Bosch");
  await page.getByLabel("Catégorie").selectOption("bricolage");
  await page.getByLabel("État").selectOption("bon");
  await page.getByLabel("Description").fill("Ponceuse avec 20 disques grain 80 et 120, aspiration intégrée.");
  await page.getByLabel("Prix par jour (€)").fill("7");
  await page.getByRole("button", { name: "Publier l'annonce" }).click();
  await expect(page.getByText(/au moins une photo/)).toBeVisible();
  await expect(page.getByLabel("Titre de l'annonce")).toHaveValue("Ponceuse orbitale Bosch");
});

test("F02-E3 titre de 80 caractères accepté, prix absurde refusé", async ({ page, context }) => {
  const owner = await createUser("Loueur Bavard");
  await signIn(context, owner);
  await page.goto("/annonces/nouvelle");
  const title = "Groupe électrogène ".padEnd(80, "x");
  await page.getByTestId("photo-picker").setInputFiles({ name: "g.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Titre de l'annonce").fill(title + "dépassement");
  await expect(page.getByLabel("Titre de l'annonce")).toHaveValue(title);
  await page.getByLabel("Catégorie").selectOption("bricolage");
  await page.getByLabel("État").selectOption("bon");
  await page.getByLabel("Description").fill("Groupe 3 kW, autonomie 8 h, idéal pour les coupures de courant.");
  await page.getByLabel("Prix par jour (€)").fill("-5");
  await page.getByRole("button", { name: "Publier l'annonce" }).click();
  await expect(page.getByLabel("Prix par jour (€)")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Prix par jour (€)").fill("25");
  await page.getByRole("button", { name: "Publier l'annonce" }).click();
  await expect(page.getByText("Votre annonce est en ligne")).toBeVisible();
});

test("F02-E4 annonce en pause : disparaît de la recherche, réapparaît", async ({ page, context }) => {
  const owner = await createUser("Loueur Pause");
  const marker = `Pausetest${Date.now()}`;
  const id = await createTestListing(owner.id, { title: `Bétonnière ${marker}` });
  await page.goto(`/recherche?q=${marker}`);
  await expect(page.getByTestId("listing-card")).toHaveCount(1);
  await signIn(context, owner);
  await page.goto(`/annonces/${id}`);
  await page.getByRole("button", { name: /Mettre en pause/ }).click();
  await expect(page.getByRole("button", { name: /Réactiver|Remettre en ligne/ })).toBeVisible();
  await page.goto(`/recherche?q=${marker}`);
  await expect(page.getByTestId("listing-card")).toHaveCount(0);
});

test("F02-N1 modifier l'annonce d'un autre membre est impossible", async ({ page, context }) => {
  const owner = await createUser("Vrai Propriétaire");
  const intruder = await createUser("Intrus");
  const id = await createTestListing(owner.id);
  await signIn(context, intruder);
  expect((await page.goto(`/annonces/${id}/modifier`))?.status()).toBe(404);
  allowNotFound(page);
  await page.goto(`/annonces/${id}`);
  await expect(page.getByRole("button", { name: /Mettre en pause/ })).toHaveCount(0);
});

test("F02-N2 visiteur non connecté renvoyé vers la connexion", async ({ page }) => {
  await page.goto("/annonces/nouvelle");
  await expect(page).toHaveURL(/\/connexion\?next=%2Fannonces%2Fnouvelle/);
});

test("F02-E5 limite d'inscriptions par adresse IP non contournable par un en-tête falsifié", async ({ browser }) => {
  // Derrière un proxy, l'adresse réelle est la dernière ajoutée à X-Forwarded-For ;
  // ce qui précède est écrit par le client et peut être inventé.
  const realIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  const results: boolean[] = [];
  for (let i = 0; i < 11; i++) {
    const context = await browser.newContext({
      ...test.info().project.use,
      extraHTTPHeaders: { "x-forwarded-for": `10.9.${i}.${Math.floor(Math.random() * 250)}, ${realIp}` },
    });
    const page = await context.newPage();
    await page.goto("/inscription");
    await page.getByLabel("Prénom et nom").fill(`Robot ${i}`);
    await page.getByLabel("Adresse e-mail").fill(`robot-${Date.now()}-${i}@test.gf`);
    await page.getByLabel("Mot de passe").fill("motdepasse-robot");
    await page.getByLabel("Votre commune").selectOption("cayenne");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const ok = await Promise.race([
      page.waitForURL(/\/compte$/).then(() => true),
      page.getByText(/Trop de tentatives/).waitFor().then(() => false),
    ]);
    results.push(ok);
    await context.close();
  }
  expect(results.filter(Boolean)).toHaveLength(10);
  expect(results.at(-1)).toBe(false);
});

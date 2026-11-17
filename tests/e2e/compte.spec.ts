// Compte : confirmation d'adresse, mot de passe oublié, changement de mot de passe.
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { emailTokens, users } from "../../src/lib/db/schema";
import { newToken, sha256 } from "../../src/lib/ids";
import { createUser, expect, expectAccessible, PASSWORD, signIn, test } from "./fixtures";

/** Jeton d'e-mail tel que l'application le crée (seul son haché est stocké). */
async function createEmailToken(userId: string, type: "verify" | "reset") {
  const token = newToken();
  await db.insert(emailTokens).values({ id: sha256(token), userId, type, expiresAt: new Date(Date.now() + 3_600_000) });
  return token;
}

test("confirmation d'adresse : le lien confirme une fois, puis il est refusé", async ({ page, context }) => {
  const user = await createUser("Membre À Confirmer");
  await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, user.id));
  await signIn(context, user);

  // (Sans SMTP, comme ici, le site n'exige pas la confirmation : on vérifie le lien lui-même.)
  const token = await createEmailToken(user.id, "verify");
  await page.goto(`/verifier/${token}`);
  await expect(page.getByRole("heading", { name: "Adresse confirmée" })).toBeVisible();
  await expectAccessible(page);

  const [row] = await db.select({ verifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.id, user.id));
  expect(row.verifiedAt).not.toBeNull();

  await page.goto(`/verifier/${token}`);
  await expect(page.getByRole("heading", { name: "Lien invalide" })).toBeVisible();
});

test("mot de passe oublié : nouveau mot de passe, l'ancien ne marche plus, le lien ne sert qu'une fois", async ({ page }) => {
  const user = await createUser("Membre Oublieux");
  const nouveau = "nouveau-motdepasse-2026";

  await page.goto("/mot-de-passe-oublie");
  await page.getByLabel("Adresse e-mail du compte").fill(user.email);
  await page.getByRole("button", { name: "Recevoir un lien" }).click();
  await expect(page.getByText(/Si un compte existe avec cette adresse/)).toBeVisible();
  await expectAccessible(page);

  // Le lien de l'e-mail : on en crée un comme le fait l'action (le jeton envoyé n'est stocké que haché).
  const token = await createEmailToken(user.id, "reset");
  await page.goto(`/reinitialiser/${token}`);
  await page.getByLabel("Nouveau mot de passe").fill(nouveau);
  await page.getByLabel("Confirmez le mot de passe").fill("autre-chose-2026");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Les mots de passe ne correspondent pas")).toBeVisible();
  await page.getByLabel("Confirmez le mot de passe").fill(nouveau);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/\/compte\?motdepasse=1/);
  await expect(page.getByText("Nouveau mot de passe enregistré.")).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(user.email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
  await page.getByLabel("Mot de passe").fill(nouveau);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).not.toHaveURL(/\/connexion/);

  await page.goto(`/reinitialiser/${token}`);
  await page.getByLabel("Nouveau mot de passe").fill("encore-un-autre-2026");
  await page.getByLabel("Confirmez le mot de passe").fill("encore-un-autre-2026");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Ce lien a expiré ou a déjà été utilisé/)).toBeVisible();
});

test("changer son mot de passe depuis le compte", async ({ page, context }) => {
  const user = await createUser("Membre Prudent");
  await signIn(context, user);
  await page.goto("/compte");
  await page.getByLabel("Mot de passe actuel").fill("pas-le-bon-mot-de-passe");
  await page.getByLabel("Nouveau mot de passe").fill("tout-nouveau-2026");
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText("Mot de passe actuel incorrect")).toBeVisible();
  await page.getByLabel("Mot de passe actuel").fill(PASSWORD);
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText("Mot de passe modifié.")).toBeVisible();
  await expectAccessible(page);
});

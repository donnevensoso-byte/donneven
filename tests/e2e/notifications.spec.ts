// Notifications : on voit ce qui est lu ou non ; ouvrir une notification la marque comme lue.
import { notify } from "../../src/lib/services/notifications";
import { createUser, expect, expectAccessible, signIn, test } from "./fixtures";

test("ouvrir une notification la passe en « Lu », les autres restent « Nouveau »", async ({ page, context }) => {
  const user = await createUser("Membre Notifié");
  await notify(user.id, { title: "Nouvelle demande de réservation", body: "Une demande vous attend.", link: "/reservations" });
  await notify(user.id, { title: "Vous avez reçu un avis", body: "5 étoiles.", link: "/compte" });
  await signIn(context, user);

  await page.goto("/compte/notifications");
  await expect(page.getByText("2 non lues", { exact: false })).toBeVisible();
  await expect(page.getByText("Nouveau", { exact: true })).toHaveCount(2);
  await expectAccessible(page);

  await page.getByRole("link", { name: /Vous avez reçu un avis/ }).click();
  await expect(page).toHaveURL(/\/compte$/);

  await page.goto("/compte/notifications");
  await expect(page.getByText("1 non lue", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: /Vous avez reçu un avis/ }).getByText("Lu", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Nouvelle demande/ }).getByText("Nouveau", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(page.getByText("Tout est lu.")).toBeVisible();
  await expect(page.getByText("Nouveau", { exact: true })).toHaveCount(0);
});

test("la notification d'un autre membre ne s'ouvre pas et reste non lue", async ({ page, context }) => {
  const owner = await createUser("Membre Propriétaire Notif");
  const intruder = await createUser("Membre Curieux");
  await notify(owner.id, { title: "Message privé", body: "Pour le propriétaire seulement.", link: "/compte" });
  await signIn(context, owner);
  await page.goto("/compte/notifications");
  const href = await page.getByRole("link", { name: /Message privé/ }).getAttribute("href");

  await context.clearCookies();
  await signIn(context, intruder);
  await page.goto(href!);
  await expect(page).toHaveURL(/\/compte\/notifications$/);
  await expect(page.getByText("Message privé")).toHaveCount(0);

  await context.clearCookies();
  await signIn(context, owner);
  await page.goto("/compte/notifications");
  await expect(page.getByRole("link", { name: /Message privé/ }).getByText("Nouveau", { exact: true })).toBeVisible();
});

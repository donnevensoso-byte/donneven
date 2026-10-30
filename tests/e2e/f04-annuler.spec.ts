// F04 Annuler.
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { bookings } from "../../src/lib/db/schema";
import { addDays, todayInGuyane } from "../../src/lib/dates";
import { confirmHandover, requestBooking, respondToBooking } from "../../src/lib/services/bookings";
import { createTestListing, createUser, expect, expectAccessible, openAs, signIn, test } from "./fixtures";

const day = (n: number) => addDays(todayInGuyane(), n);

async function setup(start = 3) {
  const owner = await createUser("Loueur Annulation");
  const renter = await createUser("Locataire Annulation");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(start), endDate: day(start + 1) });
  return { owner, renter, listingId, id };
}

async function cancel(page: import("@playwright/test").Page, reason: string) {
  await page.getByRole("button", { name: /Annuler (la réservation|ma demande)/ }).click();
  await page.getByLabel("Pourquoi annulez-vous ?").fill(reason);
  await page.getByRole("button", { name: "Confirmer l'annulation" }).click();
}

test("F04-H1 le locataire annule sa demande en attente", async ({ page, context }) => {
  const { renter, id } = await setup();
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await cancel(page, "J'ai trouvé chez un voisin");
  await expect(page.getByText("Annulée", { exact: true }).first()).toBeVisible();
  await expectAccessible(page);
});

test("F04-H2 le loueur annule une réservation confirmée : le locataire le voit, les dates se libèrent", async ({ page, context, browser }) => {
  const { owner, renter, listingId, id } = await setup();
  await respondToBooking(owner.id, id, "accept");
  await signIn(context, owner);
  await page.goto(`/reservations/${id}`);
  await cancel(page, "Machine en panne, désolé");
  await expect(page.getByText("Annulée", { exact: true }).first()).toBeVisible();

  const r = await openAs(browser, renter);
  await r.page.goto(`/reservations/${id}`);
  await expect(r.page.getByText("Annulée", { exact: true }).first()).toBeVisible();
  await expect(r.page.getByText("Machine en panne")).toBeVisible();
  await r.close();
  const other = await createUser("Locataire Suivant");
  await expect(requestBooking(other.id, { listingId, startDate: day(3), endDate: day(4) })).resolves.toBeTruthy();
});

test("F04-E1 plus d'annulation une fois la location commencée", async ({ page, context }) => {
  const { owner, renter, id } = await setup(1);
  await respondToBooking(owner.id, id, "accept");
  const [{ code }] = await db.select({ code: bookings.handoverCode }).from(bookings).where(eq(bookings.id, id));
  await confirmHandover(owner.id, id, code!);
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await expect(page.getByText("En cours", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Annuler (la réservation|ma demande)/ })).toHaveCount(0);
});

test("F04-E2 retour arrière après annulation : pas de double annulation", async ({ page, context }) => {
  const { renter, id } = await setup();
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await cancel(page, "Changement de programme");
  await expect(page.getByText("Annulée", { exact: true }).first()).toBeVisible();
  await page.goBack();
  await page.reload();
  await expect(page.getByRole("button", { name: /Annuler (la réservation|ma demande)/ })).toHaveCount(0);
});

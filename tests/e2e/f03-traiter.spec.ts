// F03 Le loueur traite une demande.
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { bookings } from "../../src/lib/db/schema";
import { addDays, todayInGuyane } from "../../src/lib/dates";
import { requestBooking, respondToBooking } from "../../src/lib/services/bookings";
import { createTestListing, createUser, expect, expectAccessible, openAs, signIn, test } from "./fixtures";

const day = (n: number) => addDays(todayInGuyane(), n);

test("F03-H2 refuser avec un motif : le locataire le voit", async ({ page, context, browser }) => {
  const owner = await createUser("Loueur Refus");
  const renter = await createUser("Locataire Refusé");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(3), endDate: day(4) });
  await signIn(context, owner);
  await page.goto(`/reservations/${id}`);
  await expectAccessible(page);
  await page.getByRole("button", { name: "Refuser" }).click();
  await page.getByLabel(/Motif du refus/).fill("Je l'utilise moi-même ce week-end, désolée !");
  await page.getByRole("button", { name: "Confirmer le refus" }).click();
  await expect(page.getByText("Refusée", { exact: true }).first()).toBeVisible();

  const r = await openAs(browser, renter);
  await r.page.goto(`/reservations/${id}`);
  await expect(r.page.getByText("Refusée", { exact: true }).first()).toBeVisible();
  await expect(r.page.getByText("Je l'utilise moi-même ce week-end")).toBeVisible();
  await r.close();
});

test("F03-E1 deux demandes sur les mêmes dates : accepter l'une refuse l'autre", async ({ page, context }) => {
  const owner = await createUser("Loueur Demandé");
  const a = await createUser("Locataire A");
  const b = await createUser("Locataire B");
  const listingId = await createTestListing(owner.id);
  const idA = await requestBooking(a.id, { listingId, startDate: day(4), endDate: day(6) });
  const idB = await requestBooking(b.id, { listingId, startDate: day(5), endDate: day(7) });
  await signIn(context, owner);
  await page.goto(`/reservations/${idA}`);
  await page.getByRole("button", { name: /Accepter la demande/ }).click();
  // « Confirmée » est aussi une étape de la frise : on attend la disparition du bouton.
  await expect(page.getByRole("button", { name: /Accepter la demande/ })).toHaveCount(0);
  const [rowB] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, idB));
  expect(rowB.status).toBe("declined");
  await page.goto(`/reservations/${idB}`);
  await expect(page.getByRole("button", { name: /Accepter la demande/ })).toHaveCount(0);
});

test("F03-E2 deux onglets : accepter puis refuser depuis un onglet périmé", async ({ page, context, browser }) => {
  const owner = await createUser("Loueur Deux Onglets");
  const renter = await createUser("Locataire Deux Onglets");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(3), endDate: day(4) });
  await signIn(context, owner);
  const stale = await openAs(browser, owner);
  await stale.page.goto(`/reservations/${id}`);
  await page.goto(`/reservations/${id}`);
  await page.getByRole("button", { name: /Accepter la demande/ }).click();
  // « Confirmée » est aussi une étape de la frise : on attend la disparition du bouton.
  await expect(page.getByRole("button", { name: /Accepter la demande/ })).toHaveCount(0);
  await stale.page.getByRole("button", { name: "Refuser" }).click();
  await stale.page.getByRole("button", { name: "Confirmer le refus" }).click();
  await expect(stale.page.getByText(/déjà été traitée/)).toBeVisible();
  await stale.close();
  const [row] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, id));
  expect(row.status).toBe("accepted");
});

test("F03-E3 code faux 5 fois : blocage temporaire, le bon code ne passe plus", async ({ page, context }) => {
  const owner = await createUser("Loueur Code");
  const renter = await createUser("Locataire Code");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(1), endDate: day(2) });
  await respondToBooking(owner.id, id, "accept");
  const [{ code }] = await db.select({ code: bookings.handoverCode }).from(bookings).where(eq(bookings.id, id));
  const wrong = code === "0000" ? "1111" : "0000";
  await signIn(context, owner);
  await page.goto(`/reservations/${id}`);
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("Code de remise du locataire").fill(wrong);
    await page.getByRole("button", { name: /Confirmer la remise/ }).click();
    await expect(page.getByText(/Code incorrect/)).toBeVisible();
  }
  await page.getByLabel("Code de remise du locataire").fill(code!);
  await page.getByRole("button", { name: /Confirmer la remise/ }).click();
  await expect(page.getByText(/Trop d'essais/)).toBeVisible();
});

test("F03-E4 remise impossible avant la veille du début", async ({ page, context }) => {
  const owner = await createUser("Loueur En Avance");
  const renter = await createUser("Locataire En Avance");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(10), endDate: day(11) });
  await respondToBooking(owner.id, id, "accept");
  await signIn(context, owner);
  await page.goto(`/reservations/${id}`);
  await expect(page.getByLabel("Code de remise du locataire")).toHaveCount(0);
});

test("F03-N1 le locataire n'a ni bouton accepter ni saisie de code", async ({ page, context }) => {
  const owner = await createUser("Loueur Témoin");
  const renter = await createUser("Locataire Témoin");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(1), endDate: day(2) });
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await expect(page.getByRole("button", { name: /Accepter la demande/ })).toHaveCount(0);
  await respondToBooking(owner.id, id, "accept");
  await page.reload();
  await expect(page.getByLabel("Code de remise du locataire")).toHaveCount(0);
  await expect(page.getByTestId("handover-code")).toBeVisible();
});

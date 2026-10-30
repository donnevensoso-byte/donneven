// F05 Casse ou vol : dans Zouti, la preuve passe par l'état des lieux en photos
// (pas d'assurance intégrée, voir features.csv).
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { bookings } from "../../src/lib/db/schema";
import { addDays, todayInGuyane } from "../../src/lib/dates";
import { confirmHandover, requestBooking, respondToBooking } from "../../src/lib/services/bookings";
import { createTestListing, createUser, expect, expectAccessible, openAs, PNG, signIn, test } from "./fixtures";

const day = (n: number) => addDays(todayInGuyane(), n);

async function ongoing() {
  const owner = await createUser("Loueur Photos");
  const renter = await createUser("Locataire Photos");
  const listingId = await createTestListing(owner.id);
  const id = await requestBooking(renter.id, { listingId, startDate: day(0), endDate: day(1) });
  await respondToBooking(owner.id, id, "accept");
  const [{ code }] = await db.select({ code: bookings.handoverCode }).from(bookings).where(eq(bookings.id, id));
  await confirmHandover(owner.id, id, code!);
  return { owner, renter, id };
}

test("F05-H1 le locataire photographie un dégât au retour, visible des deux et dans le contrat", async ({ page, context, browser }) => {
  const { owner, renter, id } = await ongoing();
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await page.getByRole("radio", { name: /retour/i }).check();
  await page.getByTestId("photo-picker").setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: PNG },
    { name: "b.png", mimeType: "image/png", buffer: PNG },
  ]);
  await page.getByLabel("Remarque").fill("Fissure sur le carter, déjà là à la remise ?");
  await page.getByRole("button", { name: /Ajouter à l'état des lieux/ }).click();
  await expect(page.getByTestId("photos-return").locator("li")).toHaveCount(2);
  await expectAccessible(page);

  const o = await openAs(browser, owner);
  await o.page.goto(`/reservations/${id}`);
  await expect(o.page.getByTestId("photos-return").locator("li")).toHaveCount(2);
  await o.page.goto(`/reservations/${id}/contrat`);
  await expect(o.page.getByText("Fissure sur le carter").first()).toBeVisible();
  await o.close();
});

test("F05-E1 un fichier qui n'est pas une image est refusé proprement", async ({ page, context }) => {
  const { renter, id } = await ongoing();
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await page.getByTestId("photo-picker").setInputFiles({ name: "facture.png", mimeType: "image/png", buffer: Buffer.from("ceci n'est pas une image") });
  await page.getByRole("button", { name: /Ajouter à l'état des lieux/ }).click();
  await expect(page.getByRole("alert").or(page.locator(".field-error")).first()).toBeVisible();
  await expect(page.getByTestId("photos-handover").locator("li")).toHaveCount(0);
});

test("F05-E2 8 photos d'un coup à la remise, puis une 9e : refus clair", async ({ page, context }) => {
  const { renter, id } = await ongoing();
  await signIn(context, renter);
  await page.goto(`/reservations/${id}`);
  await page.getByRole("radio", { name: "À la remise" }).check();
  const files = Array.from({ length: 8 }, (_, i) => ({ name: `p${i}.png`, mimeType: "image/png", buffer: PNG }));
  await page.getByTestId("photo-picker").setInputFiles(files);
  await page.getByRole("button", { name: /Ajouter à l'état des lieux/ }).click();
  await expect(page.getByTestId("photos-handover").locator("li")).toHaveCount(8);
  await page.getByRole("radio", { name: "À la remise" }).check();
  await page.getByTestId("photo-picker").setInputFiles({ name: "p9.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: /Ajouter à l'état des lieux/ }).click();
  await expect(page.getByText(/8 photos maximum par personne à la remise/)).toBeVisible();
  await expect(page.getByTestId("photos-handover").locator("li")).toHaveCount(8);
});

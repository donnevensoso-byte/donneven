// Parcours de bout en bout (Playwright) sur une base fraîchement initialisée :
//   npm run db:reset && npm run build && npm start   puis   node scripts/e2e.cjs [dossier-captures]
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const out = process.argv[2] || require('node:os').tmpdir();
const day = (n) => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
const log = (...a) => console.log('✔', ...a);

async function login(browser, email) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(BASE + '/connexion');
  await page.fill('input[name=email]', email);
  await page.fill('input[name=password]', 'woule2026');
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/connexion')), page.click('button[type=submit]')]);
  return page;
}

(async () => {
  const browser = await chromium.launch();

  // 1. Locataire : réservation instantanée + paiement démo
  let page = await login(browser, 'locataire@woule.test');
  log('connexion locataire');
  await page.goto(BASE + '/recherche?territoire=martinique&instant=1');
  const href = await page.locator('a[href^="/vehicules/"]').first().getAttribute('href');
  await page.goto(BASE + href);
  await page.fill('input[name=start]', day(40));
  await page.fill('input[name=end]', day(47));
  await page.locator('text=Total').first().waitFor();
  const total = await page.locator('dl >> text=Total').locator('..').innerText();
  log('prix affiché', total.replace(/\n/g, ' '));
  await Promise.all([page.waitForURL(/\/reservations\//), page.click('button:has-text("Réserver maintenant")')]);
  log('réservation créée', page.url());
  await page.click('button:has-text("Payer")');
  await page.waitForURL(/paiement/);
  await Promise.all([page.waitForURL(/paiement=ok/), page.click('button:has-text("Payer")')]);
  await page.locator('text=Paiement confirmé').waitFor();
  log('paiement démo → confirmée');
  await page.fill('textarea[name=body]', 'Bonjou ! Hâte de découvrir la Martinique 🌺');
  await page.click('button:has-text("Envoyer")');
  await page.locator('text=Hâte de découvrir').waitFor();
  log('message envoyé');
  await page.screenshot({ path: `${out}/e2e-booking.png`, fullPage: true });
  // double réservation refusée
  await page.goto(BASE + href);
  await page.fill('input[name=start]', day(41));
  await page.fill('input[name=end]', day(43));
  await page.locator("text=n'est pas disponible sur ces dates").waitFor();
  log('chevauchement détecté côté client');
  await page.context().close();

  // 2. Propriétaire : accepter la demande de Kenny
  page = await login(browser, 'proprio@woule.test');
  await page.goto(BASE + '/proprietaire');
  await page.locator('text=Demandes à traiter').waitFor();
  await page.screenshot({ path: `${out}/e2e-owner.png`, fullPage: true });
  await page.locator('section:has-text("Demandes à traiter") a[href^="/reservations/"]').first().click();
  await page.waitForURL(/\/reservations\//);
  await page.click('button:has-text("Accepter")');
  await page.locator('text=En attente du paiement').waitFor();
  log('demande acceptée par le propriétaire');
  // création d'une annonce
  await page.goto(BASE + '/proprietaire/vehicules/nouveau');
  await page.fill('input[name=make]', 'Hyundai');
  await page.fill('input[name=model]', 'Kona Électrique');
  await page.selectOption('select[name=category]', 'SUV');
  await page.selectOption('select[name=fuel]', 'ELECTRIQUE');
  await page.selectOption('select[name=transmission]', 'AUTOMATIQUE');
  await page.selectOption('select[name=commune]', 'Le Moule');
  await page.fill('input[name=pricePerDay]', '52');
  await page.check('input[name=airportDelivery]');
  await page.check('input[name=instantBooking]');
  await Promise.all([page.waitForURL(/cree=1/), page.click('button:has-text("Publier l\'annonce")')]);
  log('annonce créée', page.url());
  await page.fill('input[name=start]', day(60));
  await page.fill('input[name=end]', day(62));
  await page.click('button:has-text("Bloquer")');
  await page.locator('text=Période bloquée').waitFor();
  log('période bloquée');
  await page.context().close();

  // 3. Marc : état des lieux de retour + avis sur la location en cours
  page = await login(browser, 'marc@woule.test');
  await page.goto(BASE + '/compte/locations');
  await page.locator('a:has-text("En cours")').first().click();
  await page.waitForURL(/\/reservations\//);
  await page.fill('input[name=mileage]', '41300');
  await page.click('button:has-text("Valider le retour")');
  await page.locator('text=Location terminée').first().waitFor();
  log('check-out effectué');
  await page.reload();
  await page.click('button[aria-label="5 étoiles"]');
  await page.fill('textarea[name=comment]', 'Super voiture, Josiane est adorable. Mèsi !');
  await page.click('button:has-text("Publier mon avis")');
  await page.locator('text=Vous avez noté cette location').waitFor();
  log('avis publié');
  await page.context().close();

  // 4. Admin : vigilance cyclonique + validation permis
  page = await login(browser, 'admin@woule.test');
  await page.goto(BASE + '/admin');
  await page.selectOption('select[name=territory]', 'martinique');
  await page.selectOption('select[name=level]', 'ROUGE');
  await page.fill('input[name=title]', 'Tempête tropicale Kirk — vigilance rouge');
  await page.click('button:has-text("Publier")');
  await page.locator('text=Vigilance publiée').waitFor();
  await page.click('button:has-text("Valider")');
  await page.locator('text=Rien à vérifier').waitFor();
  log('alerte publiée + permis validé');
  await page.goto(BASE + '/');
  await page.locator('text=Garantie Cyclone active').waitFor();
  await page.screenshot({ path: `${out}/e2e-alert.png` });
  log('bandeau cyclone affiché');
  await page.context().close();

  // 5. Locataire : annulation remboursée à 100 % grâce à la Garantie Cyclone
  page = await login(browser, 'locataire@woule.test');
  await page.goto(BASE + '/compte/locations');
  const rows = page.locator('a[href^="/reservations/"]:has-text("Confirmée")');
  await rows.first().click();
  await page.waitForURL(/\/reservations\//);
  await page.click('button:has-text("Annuler la réservation")');
  const policy = await page.locator('form:has-text("Confirmer l\'annulation") p').first().innerText();
  log('politique', policy);
  if (!policy.includes('Garantie Cyclone')) throw new Error('Garantie Cyclone non appliquée');
  await page.click('button:has-text("Confirmer l\'annulation")');
  await page.locator('text=(intégral)').first().waitFor();
  log('annulation Garantie Cyclone OK');
  await page.context().close();

  // 6. Inscription d'un nouveau membre
  const ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(BASE + '/inscription');
  await page.fill('input[name=firstName]', 'Nadège');
  await page.fill('input[name=lastName]', 'Pierre-Louis');
  await page.fill('input[name=email]', `nadege${Date.now()}@exemple.fr`);
  await page.selectOption('select[name=territory]', 'guyane');
  await page.fill('input[name=birthDate]', '1995-04-10');
  await page.fill('input[name=password]', 'motdepasse123');
  await page.check('input[name=cgu]');
  await Promise.all([page.waitForURL(/bienvenue=1/), page.click('button:has-text("Créer mon compte")')]);
  log('inscription OK');
  await ctx.close();

  await browser.close();
  console.log('E2E TERMINÉ');
})().catch((e) => { console.error('ÉCHEC', e.message); process.exit(1); });

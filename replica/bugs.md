# Bugs : Zouti

Build testé : 67d7d9c. Navigateur : Chromium (Playwright), profil Pixel 7 (412 px), fr-FR, America/Cayenne.
Seuls les bugs reproduits sont listés ; les doutes sont en bas, dans « À vérifier ».

Bilan : 10 bugs (S1 : 1, S2 : 2, S3 : 6, S4 : 1). 9 corrigés, 1 ouvert (S4).

### BUG-010: erreur 500 sur toutes les pages en production si APP_URL est saisi sans https://

- Severity: S1
- Flow / case: mise en ligne (constaté sur https://zouti97.fr le 2026-10-31)
- Screen: toutes les pages (la mise en page racine)
- Build: 35a301e

Steps
1. Dans Render, saisir `APP_URL=zouti97.fr` (sans `https://`).
2. Ouvrir https://zouti97.fr.

Expected: le site s'affiche ; l'adresse est complétée en `https://zouti97.fr`.
Actual: « Internal Server Error » (500) sur l'accueil et les pages légales : `new URL("zouti97.fr")` lève une erreur dans les métadonnées de la mise en page. `/api/health` répondait pourtant `{"ok":true}`. De plus, `robots.txt` était figé au build et annonçait `http://localhost:3000/sitemap.xml`.
Evidence: pages en 500 et plan du site en `zouti97.fr/…` sans protocole, relevés sur le site en ligne ; test unitaire « appUrl » rouge avant correction.
Status: fixed in f30d953 (appUrl() ajoute https:// ; robots.txt rendu à chaque requête ; la tâche planifiée suit les redirections)

### BUG-003: la limite anti-abus par adresse IP se contourne avec un en-tête falsifié

- Severity: S2
- Flow / case: F02 / F02-E5 (touche aussi la connexion et « mot de passe oublié »)
- Screen: S06 inscription, connexion
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Envoyer 11 inscriptions depuis la même adresse, chacune avec `X-Forwarded-For: <adresse inventée>, <adresse réelle>`.

Expected: la 11e inscription de l'heure est refusée (« Trop de tentatives »).
Actual: les 11 passent. `clientKey()` lit la première adresse de l'en-tête, celle que le client écrit lui-même ; derrière un proxy, l'adresse fiable est la dernière ajoutée.
Evidence: `tests/e2e/f02-publier.spec.ts` › F02-E5 (11 succès sur 11).
Suspected cause: `src/app/actions/auth.ts`, `clientKey()`.
Status: fixed in 1bf3d0c (`clientIp()` lit X-Forwarded-For depuis la fin, `TRUSTED_PROXIES` = 1 par défaut ; test unitaire + F02-E5)

### BUG-006: deux onglets qui envoient la même demande au même instant créent deux réservations

- Severity: S3
- Flow / case: F01 / F01-E3
- Screen: S04 annonce
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Ouvrir la même annonce dans deux onglets, mêmes dates.
2. Cliquer « Demander à réserver » dans les deux au même moment.

Expected: une seule demande ; la seconde reçoit « Vous avez déjà une demande en attente sur ces dates ».
Actual: deux demandes en attente identiques (reproduit 1 fois sur 2 passages). Le loueur voit deux demandes ; en accepter une refuse l'autre, donc pas de double location, mais le locataire reçoit un refus incompréhensible.
Evidence: `tests/e2e/f01-louer.spec.ts` › F01-E3 (« Expected length: 1, Received length: 2 »).
Suspected cause: le contrôle « demande déjà en attente » est une lecture puis une écriture, sans verrou ni contrainte en base.
Status: fixed in 71eec25 (contrainte d'exclusion `bookings_one_pending_per_renter`, migration 0003 ; F01-E3 vert 3 fois de suite, F01-E12/E13 en intégration)

### BUG-001: la vignette de l'annonce sur la page réservation est un lien sans nom

- Severity: S3
- Flow / case: F01-E9, F03-H2, F04-H1, F05-H1
- Screen: S08 réservation
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Ouvrir n'importe quelle réservation, en locataire ou en loueur.

Expected: chaque lien a un nom accessible.
Actual: axe « link-name (serious) » sur `.size-24` : le lien vers l'annonce ne contient qu'une image à `alt=""`. Un lecteur d'écran annonce « lien » sans destination.
Evidence: scan axe dans les 4 tests cités.
Status: fixed in 5fd1941 (vignette retirée du clavier et des lecteurs d'écran : le titre juste à côté mène au même endroit)

### BUG-002: le loueur ne voit pas son prix sur sa propre annonce

- Severity: S3
- Flow / case: F02 / F02-H1
- Screen: S04 annonce (vue propriétaire)
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Publier une annonce à 8,50 € / jour.
2. Regarder la page de l'annonce qui s'affiche.

Expected: le prix par jour (et semaine) apparaît, pour vérifier ce qu'on vient de publier.
Actual: le prix n'est affiché que dans le module de réservation, masqué pour le propriétaire. Seule la caution apparaît.
Evidence: `tests/e2e/f02-publier.spec.ts` › F02-H1, instantané de page dans `test-results/`.
Workaround: ouvrir « Modifier ».
Status: fixed in 0ea7d07 (« Tarif » ajouté aux détails de l'annonce, visible de tous)

### BUG-004: le lien « voir mon profil public » ne se distingue que par la couleur

- Severity: S3
- Flow / case: F06 / F06-E1
- Screen: S10 compte
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Ouvrir `/compte`.

Expected: un lien dans un texte est souligné (ou repérable autrement que par la couleur).
Actual: axe « link-in-text-block (serious) » : souligné seulement au survol.
Evidence: `tests/e2e/f06-f07-paiements-litiges.spec.ts` › F06-E1.
Status: fixed in 5fd1941

### BUG-007: messagerie : heure illisible sur ses propres messages, fil non atteignable au clavier

- Severity: S3
- Flow / case: F01 / F01-E6
- Screen: S09 messagerie
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Envoyer un message, ouvrir la conversation.

Expected: contraste AA sur l'heure ; la zone qui défile est atteignable au clavier.
Actual: axe « color-contrast (serious) » sur l'heure en `text-white/70` sur la bulle verte ; « scrollable-region-focusable (serious) » sur le fil (`overflow-y-auto` sans `tabindex`).
Evidence: `tests/e2e/f01-louer.spec.ts` › F01-E6.
Status: fixed in 5fd1941 (heure en `text-white/90`, fil en `role="log"` avec `tabIndex=0` et contour au focus)

### BUG-008: les remarques de l'état des lieux n'apparaissent pas dans le contrat

- Severity: S3
- Flow / case: F05 / F05-H1
- Screen: contrat de location (imprimable)
- Build: 5fd1941  Browser / device: Chromium, Pixel 7

Steps
1. Pendant la location, ajouter des photos au retour avec la remarque « Fissure sur le carter… ».
2. Ouvrir le contrat.

Expected: les photos et la remarque figurent dans l'état des lieux du contrat.
Actual: seules les vignettes datées y sont ; la remarque, qui décrit le dégât, manque sur le document imprimé.
Evidence: `tests/e2e/f05-etat-des-lieux.spec.ts` › F05-H1 (« Fissure sur le carter » introuvable sur `/contrat`).
Status: fixed in 33a12f7 (remarques listées sous les vignettes, une fois par envoi)

### BUG-009: supprimer son compte effaçait un litige ouvert et ses preuves

- Severity: S2
- Flow / case: F07 / trouvé pendant le préflight de /replica-deploy (« la suppression de compte fonctionne »)
- Screen: compte, suppression
- Build: 14301fb

Steps
1. Une location terminée fait l'objet d'un litige ouvert par le propriétaire.
2. Le locataire supprime son compte.

Expected: la suppression est refusée tant que le litige est ouvert.
Actual: la suppression passe et, par cascade, efface la réservation, ses photos d'état des lieux et le litige.
Evidence: `tests/integration/disputes.test.ts` › BUG-009 (rouge avant correction).
Status: fixed in b4f5a03

### BUG-005: le sélecteur de photos d'état des lieux ignore les photos déjà envoyées

- Severity: S4
- Flow / case: F05 / F05-E2
- Screen: S08 réservation
- Build: 67d7d9c  Browser / device: Chromium, Pixel 7

Steps
1. Ajouter 8 photos à la remise.
2. Rechoisir « À la remise » : le bouton « Ajouter » est toujours là ; choisir une 9e photo et envoyer.

Expected: le sélecteur indique qu'il ne reste plus de place pour cette étape.
Actual: la photo est préparée puis refusée par le serveur (« 8 photos maximum par personne à la remise »). Rien n'est perdu.
Evidence: `tests/e2e/f05-etat-des-lieux.spec.ts` › F05-E2.
Status: open (S4, pas bloquant : le serveur refuse proprement)

## À vérifier (non reproduit)

- `TRUSTED_PROXIES` doit correspondre à l'hébergement réel (1 derrière un seul proxy : Render, Railway, nginx…). Si l'application est exposée sans proxy, l'en-tête reste entièrement écrit par le client : à vérifier au déploiement (`/replica-deploy`).
- Empreinte bancaire et remboursements avec un vrai compte Stripe test : jamais exécutés (Stripe injoignable d'ici). Voir la passe manuelle de `test-plan.md`.
- E-mails réels (SMTP) : non testés.
- Conservation comptable : supprimer un compte efface aussi ses réservations terminées. Si le paiement en ligne est activé, il faudra conserver les traces de transactions (Stripe les garde de son côté) : à valider avec un comptable avant d'activer la carte.

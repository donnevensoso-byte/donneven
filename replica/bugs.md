# Bugs : Zouti

Build testé : 67d7d9c. Navigateur : Chromium (Playwright), profil Pixel 7 (412 px), fr-FR, America/Cayenne.
Seuls les bugs reproduits sont listés ; les doutes sont en bas, dans « À vérifier ».

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
Status: open

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
Status: open

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
Status: open

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
Status: open

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
Status: open

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
Status: open

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
Status: open

## À vérifier (non reproduit)

- Courses en base hors interface : 3 demandes identiques en parallèle au niveau du service n'ont donné qu'une réservation (`tests/integration/races.test.ts`), mais BUG-006 montre que la fenêtre existe. Le correctif doit couvrir les deux.
- Empreinte bancaire et remboursements avec un vrai compte Stripe test : jamais exécutés (Stripe injoignable d'ici). Voir la passe manuelle de `test-plan.md`.
- E-mails réels (SMTP) : non testés.

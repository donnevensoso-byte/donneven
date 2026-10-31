# Déploiement : Zouti

Date : 2026-10-31. Build vérifié : `b4f5a03` (branche `claude/zouti-web-app`).

**Statut : prêt techniquement, pas encore en ligne.** La mise en ligne attend ton feu vert et trois choses que toi seul peux faire : l'identité légale de l'éditeur, le compte d'hébergement et le nom de domaine (voir « Ce qu'il te faut fournir »).

## 1. Préflight

| contrôle | commande | résultat |
| --- | --- | --- |
| Typage | `npx tsc --noEmit` | ✅ propre |
| Build de production | `npm run build` et `STANDALONE=1 npm run build` (comme le Dockerfile) | ✅ propres |
| Tests unitaires et d'intégration | `npx vitest run` | ✅ 9 fichiers, **56 tests** |
| Parcours de bout en bout (Playwright, mobile, axe, garde-fous console et 5xx) | `npx playwright test` | ✅ **45 sur 45** |
| Parité, indispensables | `parity.py replica/features.csv` | ✅ **80,6 / 100, 14 sur 14** |
| Restes de l'original (nom, domaines, couleurs) | `sweep.py . --config replica/brand.json` | ✅ « Clean » |
| Fiche des stores | `listing.py replica/launch/listing.json` | ✅ 0 erreur, 0 avertissement |
| Artefact de production sur une base **vide** | `node server.js` issu du build autonome | ✅ 6 migrations appliquées au démarrage, `/api/health` → `{"ok":true}`, 12 pages et fichiers publics en 200, `/api/cron` → 401 sans secret, JSON avec secret |
| Bugs S1 / S2 ouverts | `replica/bugs.md` | ✅ aucun (9 trouvés, 8 corrigés, reste 1 S4 cosmétique) |
| Suppression de compte | test d'intégration | ✅ fonctionne ; refusée pendant une réservation en cours ou un litige ouvert (BUG-009, corrigé pendant ce préflight) |
| Cookies | revue | ✅ un seul cookie de session, strictement nécessaire : **pas de bandeau requis** |
| Favicon, titres, image de partage | revue | ✅ à Zouti ; image Open Graph 1200 × 630 ajoutée pendant ce préflight |
| Mentions légales, CGU, confidentialité | revue | ❌ **bloquant** : 11 champs `[…]` à compléter (éditeur, adresse, statut et SIRET, hébergeur, prestataire e-mail, fournisseur de cartes, médiateur de la consommation) |
| Docker | `docker compose config` | ✅ fichier valide. Image non construite ici (pas de démon Docker dans cet environnement) ; l'étape d'exécution a été rejouée à l'identique sans Docker. |

**Conclusion :** un seul point bloque, les textes légaux, et il dépend de tes informations. Tout le reste est vert.

## 2. Configuration de production prête dans le dépôt

- **`render.yaml`** (Render, région Francfort, UE) : service web Docker avec santé sur `/api/health`, base PostgreSQL 16 gérée, tâche planifiée toutes les 15 minutes qui appelle `/api/cron` avec un `CRON_SECRET` généré automatiquement.
- **`docker-compose.yml`** (VPS OVH ou Scaleway) : base, application, et service `cron` qui fait le même appel toutes les 15 minutes.
- **Migrations** : appliquées automatiquement au démarrage, jamais à la main. Le chemin depuis une base vide a été vérifié.
- **`.env.example`** : toutes les variables, dont `CRON_SECRET` et `TRUSTED_PROXIES`.
- **`.dockerignore`** : `replica/`, `.claude/`, `tests/` et `docs/` restent hors de l'image.

## 3. Ce qu'il te faut fournir (je ne crée ni n'achète rien à ta place)

1. **Identité de l'éditeur**, pour les mentions légales, les CGU et la confidentialité : nom ou raison sociale, adresse, statut (particulier, micro-entreprise, association…), SIRET le cas échéant, e-mail de contact. Il faut aussi choisir un **médiateur de la consommation**, obligatoire dès qu'on s'adresse à des consommateurs. À faire relire par un juriste.
2. **Hébergement.** Je conseille Render, avec le Blueprint fourni : environ 7 $ par mois pour le service web, environ 6 $ pour la base et environ 1 $ pour la tâche planifiée (tarifs à vérifier). Crée le compte et connecte le dépôt GitHub : *New → Blueprint →* `donnevensoso-byte/donneven`, branche à fusionner dans `main` d'abord.
3. **Nom de domaine.** `zouti.fr`, `zouti.com` et `zouti.app` sont pris (`zouti.fr` est à vendre chez un courtier). `zouti973.fr` et `zouti-guyane.fr` étaient **libres le 2026-10-30**. Achète celui que tu préfères chez un registrar (OVH, Gandi…).
4. **E-mails.** Crée un compte chez un prestataire européen, par exemple Brevo, et vérifie le domaine d'envoi. Sans ça, pas d'e-mail de vérification, de demande ni de rappel.
5. **Ton e-mail d'administrateur**, pour `ADMIN_EMAILS`.
6. **Plus tard, pour le paiement par carte :** un compte Stripe avec Connect, puis la passe manuelle en mode test de `replica/test-plan.md`. Le lancement se fait sans carte, en main propre.

## 4. Variables à saisir dans l'hébergeur

| variable | valeur |
| --- | --- |
| `DATABASE_URL` | fournie par Render (Blueprint) ou par ta base |
| `APP_URL` | `https://<ton-domaine>` (sans `/` final) |
| `ADMIN_EMAILS` | ton e-mail |
| `CRON_SECRET` | généré par Render ; sur un VPS : `openssl rand -hex 32` |
| `TRUSTED_PROXIES` | `1` (un seul proxy devant l'app, à vérifier selon l'hébergeur) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | donnés par le prestataire e-mail ; `SMTP_FROM` = `Zouti <bonjour@<ton-domaine>>` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **vides au lancement** |
| `SERVICE_FEE_PERCENT` | `10` |

**Ne jamais lancer `npm run db:seed` sur la production** : les annonces de démonstration deviendraient de fausses preuves.

## 5. DNS (une fois le domaine acheté)

| type | nom | valeur |
| --- | --- | --- |
| A | `@` | l'IP indiquée par Render dans *Settings → Custom Domains* (à ce jour, Render documente `216.24.57.1` ; utilise celle qu'il affiche) |
| CNAME | `www` | `<nom-du-service>.onrender.com` |
| TXT | `@` | SPF donné par le prestataire e-mail (Brevo : `v=spf1 include:spf.brevo.com ~all`, à vérifier dans son interface) |
| CNAME ou TXT | donnés par le prestataire | DKIM : copier exactement les enregistrements affichés |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:<ton-email>` au début, puis `p=quarantine` quand les rapports sont propres |

Choisis une seule adresse canonique (par exemple sans `www`) et redirige l'autre. Le HTTPS est automatique chez Render ; vérifie le cadenas.

## 6. Surveillance

- **Disponibilité** : UptimeRobot ou Better Stack (gratuit) sur `https://<domaine>/api/health` toutes les 5 minutes, avec alerte par e-mail ou SMS.
- **Erreurs** : journaux Render (`console.error` sur les paiements, les versements et `/api/cron`). Sentry est à brancher si le trafic monte ; il n'est pas intégré aujourd'hui.
- **Audience** : Plausible ou Umami, sans cookie, donc sans bandeau. Pas encore intégré, à ajouter quand le domaine sera choisi.
- **Sauvegardes** : Render sauvegarde la base chaque jour sur les offres payantes. Sur un VPS, `pg_dump` quotidien. Les photos sont stockées dans la base : surveille sa taille, car l'offre de 256 Mo se remplit avec quelques milliers de photos.
- **Cartes** : les tuiles OpenStreetMap conviennent à un petit trafic. Au-delà, passer à MapTiler ou Stadia (`NEXT_PUBLIC_MAP_TILE_URL`) et l'ajouter dans la confidentialité.

## 7. La première semaine

1. Faire le parcours complet sur le site en ligne, depuis ton téléphone : inscription, e-mail reçu, annonce, demande depuis un second compte, acceptation, code de remise, photos, retour, avis.
2. Vérifier que `/api/cron` tourne (journal de la tâche Render toutes les 15 minutes) et qu'un rappel part bien sur une demande proche de l'expiration.
3. Vérifier qu'un e-mail de Zouti arrive en boîte de réception, pas en spam (DMARC).
4. Suivre trois chiffres : annonces publiées, demandes envoyées, locations terminées.
5. Ensuite seulement, préparer la passe Stripe en mode test et les fiches des stores (`replica/launch/launch-plan.md`).

## 8. Application mobile

Pas d'app native : la PWA s'installe depuis le navigateur. Les fiches App Store et Google Play sont prêtes (`replica/launch/listing.json`). Elles serviront quand une app Expo sera construite ; il faudra alors les comptes développeur Apple (99 $ par an) et Google (25 $ une fois), à ton nom.

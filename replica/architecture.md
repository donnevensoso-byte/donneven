# Architecture : Zouti (refonte des fonctions de base de Bricolib, pour la Guyane)

Produit avec `/replica-architect` le 2026-10-30. Sources : `replica/recon.md`, `replica/features.csv`, `replica/fixes.md`.

Zouti est déjà construit. Ce document décrit l'architecture réelle, signale les écarts avec les règles du skill, et planifie ce qui reste à faire.

## Stack

| couche | choix | pourquoi |
| --- | --- | --- |
| web | Next.js 16 (App Router, Server Actions) + TypeScript | déjà en place ; une seule base de code pour les pages et le serveur |
| style | Tailwind 4, couleurs dans `globals.css` (`@theme`) | déjà en place ; `/replica-design` formalisera les tokens |
| mobile | PWA aujourd'hui, Expo (React Native) ensuite | la PWA s'installe sans store ; Expo réutilisera `src/lib/services` via une API |
| base de données | PostgreSQL 16, sur un hébergeur managé en Europe (Neon, Supabase ou celui de l'hébergeur) | une seule base ; contraintes fortes possibles (exclusion de chevauchement) |
| ORM | Drizzle | déjà en place ; migrations SQL versionnées dans `drizzle/`, appliquées au démarrage |
| auth | maison : mots de passe scrypt, sessions en base, cookie httpOnly | déjà en place et testé ; pas de dépendance externe. Auth.js seulement si on ajoute Google/Apple |
| paiements | Stripe Connect Express + Checkout (désactivé par défaut) | équivalent public de Lemonway chez Bricolib ; le paiement en main propre reste la règle par défaut |
| e-mail | SMTP via Nodemailer (Brevo conseillé, entreprise française) | n'importe quel fournisseur ; Resend ou Postmark possibles sans changer le code métier |
| tâches planifiées | aucune aujourd'hui (expiration calculée à la lecture) → une route `/api/cron` appelée toutes les 15 min par l'hébergeur | nécessaire pour les relances (fix 2) |
| fichiers | photos en base (WebP, ~150 Ko) | rien d'autre à héberger ; à migrer vers Cloudflare R2 au-delà de ~20 000 photos (voir « Ce qui pique ») |
| hébergement | Render, Railway ou Scalingo (Docker fourni), région UE | Vercel possible, mais Postgres et les photos en base vont mieux avec un serveur Node persistant |

Une seule base, pas de microservices.

## Schéma

**Tables : 14 aujourd'hui, 15 après la migration prévue.**

- Schéma actuel : `drizzle/0000_init.sql` (généré depuis `src/lib/db/schema.ts`).
- Migration prévue : `replica/schema.sql`. Elle a été vérifiée sur une base vierge.

**Règles d'accès : un contrôle par requête dans la couche de données** (`src/lib/services/*`), pas de sécurité au niveau des lignes (RLS).
- Chaque fonction de service reçoit l'identifiant de l'utilisateur et vérifie qu'il est le propriétaire ou un participant.
- Les tests d'intégration le vérifient avec un second utilisateur (`tests/integration/bookings.test.ts` : « intrus », « stranger »).

### Écarts avec les règles du skill

| règle | Zouti | décision |
| --- | --- | --- |
| `id uuid` | identifiants texte aléatoires de 12 à 16 caractères (`newId`, 71 bits) | **garder** : plus courts dans les URL, pas de risque de collision à cette échelle |
| `created_at` et `updated_at` partout | `updated_at` seulement sur `listings` | **ajouter** sur `bookings`, `users`, `conversations` (migration prévue) |
| propriétaire sur chaque ligne | `owner_id`, `renter_id`, `user_id`, `author_id` présents | ok |
| `on delete` décidé | décidé partout : cascade, et `set null` pour l'auteur d'un message | ok |
| index sur les clés étrangères et les colonnes filtrées | présents, sauf `blocked_periods` (index unique) et l'expiration des demandes | **ajouter** l'index partiel sur l'expiration (migration prévue) |
| contraintes CHECK sur les statuts | les énumérations Drizzle ne créent **aucune** contrainte en base | **ajouter** (migration prévue) |
| `timestamptz` en UTC | oui ; les jours de location sont des `date`, calculés à l'heure de Cayenne | ok |
| montants en centimes + devise | centimes ; pas de colonne devise (euro uniquement, la Guyane est en zone euro) | **garder**, à revoir seulement en cas d'expansion hors zone euro |
| double réservation gérée par la base | aujourd'hui : verrou `FOR UPDATE` sur l'annonce + vérification dans le code | **ajouter** la contrainte d'exclusion `bookings_no_overlap` (testée : la base refuse une seconde réservation acceptée qui chevauche) |

## API

Server Actions (appelées par les formulaires) et routes HTTP. « Membre » = connecté, « participant » = locataire ou propriétaire de la réservation.

### Compte (F06 et compte)

| action | fait | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| `signupAction` | crée un compte et ouvre une session | public | nom, e-mail, mot de passe, commune, CGU | redirection |
| `loginAction` / `logoutAction` | connexion / déconnexion | public / membre | e-mail, mot de passe | redirection |
| `forgotPasswordAction` / `resetPasswordAction` | réinitialisation par lien e-mail (valable 2 h) | public | e-mail / jeton + mot de passe | message |
| `resendVerificationAction` | renvoie l'e-mail de vérification | membre | — | message |
| `changePasswordAction` | change le mot de passe | membre | ancien + nouveau | message |
| `updateProfileAction` | profil, photo, téléphone | membre | formulaire | message |
| `deleteAccountAction` | supprime le compte (bloqué si une réservation est en cours) | membre | confirmation | redirection |
| `stripeOnboardingAction` / `stripeDashboardAction` | inscription Stripe Express, tableau de bord des versements | membre | — | URL Stripe |

### Annonces (F02)

| action | fait | qui |
| --- | --- | --- |
| `createListingAction` / `updateListingAction` | crée ou modifie une annonce avec photos | membre vérifié / propriétaire |
| `setListingStatusAction` | pause, réactive, supprime | propriétaire |
| `addBlockedPeriodAction` / `removeBlockedPeriodAction` | bloque ou débloque des dates | propriétaire |
| `toggleFavoriteAction` | ajoute ou retire un favori | membre |
| `reportAction` | signale une annonce ou un membre | membre |

### Réservation (F01, F03, F04)

| action | fait | qui |
| --- | --- | --- |
| `contactOwnerAction` | ouvre une conversation gratuite avant toute demande | membre |
| `requestBookingAction` | envoie une demande (dates, message) | membre vérifié, non propriétaire |
| `respondBookingAction` | accepte ou refuse ; refus automatique des demandes qui chevauchent | propriétaire |
| `cancelBookingAction` | annule, avec remboursement Stripe si payé | participant |
| `handoverAction` / `returnAction` | confirme la remise puis le retour | propriétaire |
| `payBookingAction` | ouvre Stripe Checkout | locataire |
| `reviewAction` | laisse un avis | participant, réservation terminée, sous 30 jours |

### Messagerie

| action | fait | qui |
| --- | --- | --- |
| `sendMessageAction` | envoie un message (limité à 30 par minute) | participant |

### Administration

| action | fait | qui |
| --- | --- | --- |
| `resolveReportAction` / `hideListingAction` / `banUserAction` | modération, avec notification du membre concerné | admin |

### Routes HTTP

| méthode et chemin | fait | qui |
| --- | --- | --- |
| `GET /api/images/[id]?s=thumb` | sert une photo (cache immuable) | public |
| `GET /api/conversations/[id]?after=` | nouveaux messages (interrogé toutes les 4 s) | participant |
| `GET /api/health` | santé de l'application et de la base | public |
| `POST /api/stripe/webhook` | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `account.updated` ; signature vérifiée | Stripe |

### Webhooks et tâches

- **Webhooks entrants :** Stripe (ci-dessus). Pas de webhook sortant.
- **Tâches :** l'expiration des demandes est calculée à chaque lecture.
- **À ajouter :** `GET /api/cron` (protégé par `CRON_SECRET`) toutes les 15 min. Il expire les demandes, envoie les relances aux loueurs 12 h avant expiration (fix 2) et un rappel au locataire la veille du retour.

Uniquement des API officielles (Stripe), avec les clés de l'utilisateur. Rien n'utilise les points d'accès de Bricolib.

## Ce qui pique

| sujet | situation |
| --- | --- |
| **Fuseaux horaires** | UTC−3 sans heure d'été. Les dates de location sont des jours calendaires guyanais, et l'expiration se calcule à minuit heure de Cayenne. Risque : un serveur ou un test configuré dans un autre fuseau. Déjà couvert par `todayInGuyane` et ses tests. |
| **Idempotence** | Le webhook Stripe peut arriver deux fois. `markBookingPaid` ne met à jour que si le statut de paiement n'est pas encore « payé ». À ajouter : stocker l'identifiant d'événement Stripe pour ignorer les rejeux. |
| **Concurrence** | Deux acceptations simultanées sont empêchées par le verrou sur l'annonce, puis par la contrainte d'exclusion (migration prévue). Le double clic sur « Demander » est empêché par le contrôle de doublon en attente. |
| **Limites de débit** | En mémoire : connexion, inscription, messages, demandes, signalements. Elles ne tiennent qu'avec **une seule instance**. Au-delà, passer à une table Postgres ou à Redis. |
| **Taille des fichiers** | 12 Mo par photo, réduite dans le navigateur puis compressée en WebP. Les photos en base alourdissent les sauvegardes ; au-delà de ~20 000 photos (~3 Go), migrer vers R2 ou S3, en gardant la table `images` comme index. |
| **Recherche** | Recherche texte avec `LIKE` sur une colonne normalisée (sans accents). Suffisant jusqu'à quelques milliers d'annonces ; ensuite, `pg_trgm`. |
| **Temps réel** | Messagerie par interrogation toutes les 4 s, sans WebSocket. Coût acceptable à petite échelle. |
| **Hors ligne** | Rien n'est mis en cache. Réseau faible dans les communes du fleuve : envisager un service worker pour l'annonce et la réservation consultées. |
| **Délivrabilité des e-mails** | SPF, DKIM et DMARC à configurer sur le domaine (voir `/replica-deploy`). Sans SMTP, aucun e-mail ne part. |
| **Multi-instances** | Les migrations au démarrage et les limites en mémoire supposent une instance unique ; mettre `SKIP_MIGRATIONS=1` si on monte en charge. |
| **Suppression RGPD** | La suppression du compte efface tout en cascade. Les réservations en cours bloquent la suppression. Il manque l'export des données (droit à la portabilité). |

## Ordre de construction

L'essentiel existe déjà. Parité actuelle : **67,9/100, 11 must-have sur 14 faits** (`parity.py`).

1. **Tranche verticale : faite.**
   - Écrans : S01, S02, S04, S05, S06, S07, S08, S09, S12.
   - Tables : toutes.
   - Le parcours complet est couvert par `tests/e2e/rental-flow.spec.ts`.

2. **Must-have restants**, les 3 « partial » de `features.csv` :
   - **Paiement en ligne bout à bout** : tester Stripe en mode test, ajouter l'empreinte (`capture_method: manual` à la demande, capture à l'acceptation) et stocker l'identifiant d'événement du webhook.
   - **Code de remise** : colonne `handover_code_hash`. Le locataire voit un code à 4 chiffres, le loueur le saisit dans `handoverAction`.
   - Écrans S05, S08 ; table `bookings` ; actions `payBookingAction`, `handoverAction`, webhook.

3. **Should-have**, dans cet ordre :
   - changer la date d'une réservation ;
   - litige depuis la réservation (statut `disputed` + fil admin) ;
   - réactivité utilisée dans le tri de recherche ;
   - pages SEO par commune et par catégorie (`/location/[commune]`, `/location/[categorie]`) ;
   - vérification d'identité légère (pièce + selfie, revue manuelle par un admin, **pas** de prestataire bloquant) ;
   - catalogue de types d'outils.

4. **Correctifs replica-entrepreneur** (`fixes.md`), en commençant par les plus solides :
   - **Fix 1 – État des lieux en photos :**
     - table `booking_photos` ;
     - composant de prise de photo réutilisant `photo-input` ;
     - affiché sur S08 et dans le contrat ;
     - actions `addBookingPhotoAction(bookingId, stage)`.
   - **Fix 2 – Relances :**
     - `reminder_sent_at`, route `/api/cron` ;
     - temps de réponse moyen sur S04 ;
     - annonces similaires proposées sur S08 en cas de refus ou d'expiration.
   - **Fix 3 :** règles d'annulation affichées dans le formulaire de réservation (S05) et sur S08.
   - **Fixes 4 à 6 :** filtre rayon (S02), heures de remise et de retour (`pickup_time`, `return_time`), `min_notice_days`.
   - **Fixes 7 et 8 :** caution par empreinte (avec le point 2), notifications push (avec l'app mobile).

Chaque étape passe par `/replica-build`, puis `/replica-test` (le test de bout en bout existant doit rester vert).

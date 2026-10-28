# Woulé 🌴

**La location de véhicules entre particuliers aux Antilles-Guyane**, inspirée de Getaround et pensée pour la
Guadeloupe (971), la Martinique (972), la Guyane (973), Saint-Barthélemy (977) et Saint-Martin (978).

> *Woulé* : « rouler » en créole.

Application web **mobile-first et installable sur téléphone (PWA)** : barre de navigation façon appli,
ajout à l'écran d'accueil, prise de photos depuis l'appareil pour les états des lieux.

## Fonctionnalités

### Locataires
- Recherche par territoire, commune ou **point de livraison (aéroport, gare maritime)**, avec les dates et les heures en **heure locale** (UTC-4 aux Antilles, UTC-3 en Guyane)
- Filtres : catégorie, boîte automatique, prix, nombre de places, réservation instantanée, livraison aéroport, **ferry autorisé** (Marie-Galante, Les Saintes, La Désirade), **pistes autorisées** (Guyane)
- Liste et carte (OpenStreetMap) avec un marqueur de prix par véhicule ; position floutée tant que la réservation n'est pas confirmée
- Fiche véhicule : galerie, équipements, calendrier des disponibilités, avis, profil du propriétaire et conseils de conduite propres au territoire
- Réservation **instantanée** ou **sur demande**, avec calcul du prix en direct : remises semaine et mois, livraison, 3 formules d'assurance, supplément jeune conducteur, frais de service et caution
- Paiement Stripe Checkout, ou mode démo sans clé
- États des lieux de départ et de retour depuis le téléphone : kilométrage, carburant, propreté, dommages, photos. Calcul automatique des kilomètres hors forfait
- Messagerie par réservation. Téléphone, WhatsApp et adresse exacte ne sont dévoilés qu'après confirmation
- Avis dans les deux sens, favoris, notifications

### Propriétaires
- Création d'annonce guidée : prix conseillés par catégorie, choix de la commune, position sur carte, photos
- Options locales : livraison aéroport ou port avec frais, passage en ferry, pistes, réservation instantanée
- Calendrier avec blocage de périodes (usage personnel, entretien, carnaval…)
- Tableau de bord : demandes à accepter ou refuser (expiration automatique au bout de 24 h), locations à venir, revenus, note
- Simulateur de revenus par territoire et par saison

### Spécificités Antilles-Guyane
- **Garantie Cyclone** : quand l'admin publie une vigilance Météo-France rouge, violette ou grise, un bandeau s'affiche sur tout le site, les annulations sont remboursées à 100 % et aucune location ne peut démarrer dans les 72 h
- 32 communes en Guadeloupe, 34 en Martinique et 22 en Guyane. Les communes guyanaises de l'intérieur sans accès routier sont signalées
- Aéroports et gares maritimes de chaque territoire (y compris Princess Juliana côté hollandais pour Saint-Martin)
- Indicatifs +590, +594 et +596. Permis étrangers acceptés avec un permis international

### Administration (`/admin`)
- Indicateurs : membres, annonces, volume d'affaires, revenu de la plateforme
- Vérification des permis de conduire (documents privés, visibles seulement par leur titulaire et les admins)
- Publication et levée des vigilances météo
- Modération des annonces (suspension et réactivation)

## Démarrage rapide

Prérequis : Node.js 20 ou plus.

```bash
cp .env.example .env          # puis renseignez AUTH_SECRET (openssl rand -base64 32)
npm install
npm run setup                 # crée la base SQLite et charge les données de démo
npm run dev                   # http://localhost:3000
```

Comptes de démo (mot de passe `woule2026`) :

| E-mail | Rôle |
| --- | --- |
| `locataire@woule.test` | Léa, locataire : une location confirmée en Martinique, une autre à payer |
| `proprio@woule.test` | Josiane, propriétaire en Guadeloupe : une demande à accepter |
| `admin@woule.test` | Administration |

Les données de démo comprennent 27 véhicules sur les 5 territoires, 14 membres, une quarantaine de réservations et des avis.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Build et serveur de production |
| `npm test` | Tests unitaires (prix, disponibilités, annulation, fuseaux horaires, recherche) |
| `npm run lint` | Vérification TypeScript |
| `npm run db:reset` | Remet la base à zéro et recharge les données de démo |
| `node scripts/e2e.cjs` | Parcours de bout en bout avec Playwright (application lancée sur une base fraîche) |

## Architecture

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Prisma 6** : SQLite en local ; passez à PostgreSQL en production en changeant `provider` dans `prisma/schema.prisma`
- **Tailwind CSS 4** (palette « lagon », « flamboyant », « sable »)
- **Leaflet / OpenStreetMap** pour les cartes, sans clé d'API
- Authentification maison : mots de passe hachés avec bcrypt, session JWT dans un cookie `httpOnly`
- **Stripe Checkout** et webhook `/api/stripe/webhook`, activés dès que `STRIPE_SECRET_KEY` est défini
- API publique JSON `/api/vehicles?territoire=…`, prête pour une future appli native iOS ou Android

```
prisma/            schéma et données de démo
src/app/           pages (accueil, recherche, véhicule, réservation, compte, propriétaire, admin…)
src/app/actions/   server actions (auth, véhicules, réservations, messages, avis, profil, admin)
src/app/api/       fichiers envoyés, webhook Stripe, API de recherche
src/components/    composants d'interface
src/lib/           règles métier : prix, annulation, disponibilités, territoires, fuseaux horaires
tests/             tests unitaires (Vitest)
```

### Règles métier (modifiables dans `src/lib/constants.ts`)
- Frais de service locataire : 10 % (3 € minimum) ; commission propriétaire : 20 %
- Assurance : Essentielle 9 €/j, Confort 15 €/j, Sérénité 23 €/j, avec un coefficient selon la catégorie (scooter × 0,6, 4x4 × 1,3…)
- Jeune conducteur (permis de moins de 3 ans) : +7 €/j ; âge minimum : 21 ans
- Annulation par le locataire : plus de 48 h avant, remboursement hors frais de service ; moins de 48 h avant, 50 % ; Garantie Cyclone, 100 %

## Mise en production : à faire

1. **Assurance** : signer un partenariat avec un assureur pour couvrir les véhicules pendant les locations (c'est le cœur du modèle de Getaround). Les tarifs actuels sont indicatifs.
2. **Juridique** : faire relire les CGU (modèle fourni sur `/cgu`) par un avocat, compléter les mentions légales, vérifier la TVA (DROM et COM) et le statut d'intermédiaire.
3. **Paiement** : créer un compte Stripe, renseigner `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`. Prévoir Stripe Connect pour les virements automatiques aux propriétaires et l'empreinte de caution (PaymentIntent en `capture_method: manual`).
4. **Base et fichiers** : passer à PostgreSQL (Neon, Supabase, Scaleway…) et stocker les photos sur S3 ou R2 au lieu du disque local (`src/lib/uploads.ts`).
5. **Notifications** : brancher l'envoi d'e-mails et de SMS dans `src/lib/notifications.ts` (par exemple Brevo).
6. **Vérification d'identité** : remplacer la validation manuelle des permis par un service KYC si les volumes augmentent.
7. **Applications natives** : la PWA s'installe déjà ; pour les stores, envelopper l'app avec Capacitor ou développer une appli Expo sur l'API `/api/vehicles`.

> `npm audit` signale des vulnérabilités dans des dépendances de la CLI Prisma 6 (outil de développement, absent de l'exécution). Elles disparaîtront avec la migration vers Prisma 7.

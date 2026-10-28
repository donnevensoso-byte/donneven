# Analyse de Bricolib et adaptation à la Guyane

> La fiche App Store (id6468510027) n'était pas consultable depuis l'environnement de travail. Cette analyse s'appuie sur les articles de presse cités en bas de page et sur le fonctionnement habituel des plateformes de location entre particuliers. Les points marqués *(à vérifier)* n'ont pas pu être confirmés.

## 1. Ce qu'est Bricolib

Bricolib est une plateforme française de **location d'outils entre particuliers**, ouverte aussi aux professionnels (artisans, agriculteurs, loueurs). Le principe : quelqu'un possède un outil qui dort au garage, un voisin en a besoin pour un week-end, la plateforme les met en relation.

Ordres de grandeur publiés (selon les sources et les dates) :

- 54 000 à 73 000 membres ;
- 34 000 à 42 000 outils proposés ;
- près de 20 000 réservations par an ;
- des propriétaires qui gagneraient 300 à 400 € par mois avec un parc d'outils varié.

Catégories : bricolage (perceuses, perforateurs, marteaux-piqueurs), jardinage (tondeuses, débroussailleuses), nettoyage (nettoyeurs haute pression), déménagement, réception et événementiel.

## 2. Fonctionnement et fonctionnalités clés

| Brique | Bricolib | Zouti (cette web app) |
|---|---|---|
| Compte, profil, avis | Oui | ✅ Profil public, avis mutuels après location, taux de réponse, badges |
| Annonce avec photos, prix, caution | Oui | ✅ 6 photos, prix jour + semaine, caution, durée minimale, livraison |
| Recherche géolocalisée | Oui | ✅ Par commune + carte (zone approximative), tri par distance, filtre par dates libres |
| Demande de réservation / acceptation | Oui | ✅ Réponse sous 48 h, expiration automatique, refus auto des chevauchements |
| Messagerie | Oui | ✅ Intégrée, avec messages automatiques à chaque étape |
| Paiement sécurisé en ligne | Oui *(modalités à vérifier)* | ✅ En main propre par défaut ; Stripe Connect activable |
| Caution / garantie | Oui *(forme exacte à vérifier)* | ✅ Caution en main propre + contrat et état des lieux imprimables |
| Comptes professionnels | Oui | ⏳ Feuille de route |
| Applications iOS / Android | Oui | ⏳ PWA installable dès maintenant ; app native ensuite |
| Notifications | Push | ✅ Dans l'app + e-mail ; ⏳ push |
| Modération | Oui | ✅ Signalements, masquage d'annonces, suspension de comptes |

Le **modèle économique** de ce type de plateforme repose sur une commission prélevée sur chaque location payée en ligne (frais de service), parfois complétée par une assurance ou des options payantes.

## 3. Ce qui change pour la Guyane

| Constat local | Choix dans Zouti |
|---|---|
| 22 communes très éloignées, bassins de vie distincts (île de Cayenne, Savanes, Ouest, Fleuve, Est) | Communes regroupées par bassin, recherche par commune et par distance |
| Besoins spécifiques : végétation qui repousse vite, coupures de courant, sorties sur le fleuve, vie en carbet | Catégories *Jardin & débroussaillage*, *Électricité & énergie* (groupes électrogènes), *Fleuve & nautisme*, *Carbet & camping*, *Pompes* |
| Matériel cher (importé), forte culture d'entraide (le *koudmen*) | Discours « pourquoi acheter quand le voisin peut vous le louer », inscription et publication gratuites |
| Paiements souvent en espèces ou par virement, confiance à construire | Paiement **en main propre par défaut et sans commission** pour amorcer la communauté ; paiement en ligne en option |
| WhatsApp omniprésent | Bouton WhatsApp (numéros +594 détectés) une fois la réservation confirmée |
| Réseau mobile lent ou cher hors du littoral | Photos réduites dans le navigateur puis compressées en WebP (~150 Ko), miniatures pour les listes, pages légères |
| Fuseau UTC−3 | Toutes les dates (expiration, début de location) calculées à l'heure de Cayenne |
| Identité locale | Nom « Zouti » (outils en créole), couleurs vert et jaune |

## 4. Modèle économique proposé

1. **Lancement (0 → 500 annonces)** : gratuit, sans commission. L'objectif est la densité d'annonces sur l'île de Cayenne et Kourou, puis Saint-Laurent.
2. **Monétisation** : activation du paiement en ligne (10 % de frais de service payés par le locataire, réglables via `SERVICE_FEE_PERCENT`).
3. **Compléments** : comptes professionnels (loueurs, quincailleries) avec abonnement, mise en avant d'annonces, partenariat avec un assureur local pour couvrir casse et vol.

## 5. Feuille de route

**Prochaines étapes (application mobile)**
- Notifications push (PWA puis natives).
- Application iOS / Android : soit une enveloppe Capacitor autour de la web app (rapide), soit Expo / React Native qui réutilise la logique de `src/lib/services` via une API.
- Publication sur l'App Store et le Google Play.

**Confiance et paiements**
- Vérification d'identité (pièce + selfie) et badge « identité vérifiée ».
- Empreinte bancaire pour la caution en paiement en ligne.
- Assurance casse/vol partenaire, intégrée au prix.

**Croissance**
- Comptes professionnels et multi-annonces.
- Langues de Guyane : créole guyanais, portugais (Brésil), anglais, sranan tongo.
- Alertes « préviens-moi quand une débroussailleuse est disponible à Matoury ».
- Parrainage, partage d'annonces sur WhatsApp et Facebook.

## 6. Plan de lancement opérationnel

1. **Structure juridique** (micro-entreprise ou SAS), puis compléter les mentions légales, les CGU et la politique de confidentialité, et désigner un médiateur de la consommation.
2. **Hébergement en UE** (Render, Railway, Scalingo ou un VPS OVH/Scaleway), nom de domaine, SMTP (Brevo par exemple), sauvegardes. Voir le README.
3. **Amorçage de l'offre** : recruter les 100 premiers propriétaires via les groupes Facebook et WhatsApp de quartier, les associations et les jardins partagés, et des quincailleries ou loueurs partenaires.
4. **Communication** : Radio Péyi, Guyane la 1ère, France-Guyane, réseaux sociaux, et des flyers dans les quincailleries.
5. **Mesure** : annonces actives, demandes par semaine, taux d'acceptation, délai de réponse, avis moyens (page *Administration*).

## Sources

- [Bricolib : la révolution de la location d'outils entre particuliers – Alternativi](https://alternativi.fr/bricolib-la-revolution-de-la-location-d-outils-entre-particuliers/4666)
- [Bricolib : la location d'outils entre particuliers, un modèle en plein essor – Breizh-info (2024)](https://www.breizh-info.com/2024/09/14/237505/bricolib-la-location-doutils-entre-particuliers-un-modele-en-plein-essor-qui-allie-economie-et-praticite/)
- [Bricolib veut devenir une référence du marché de la location d'outils – Le Journal des entreprises](https://www.lejournaldesentreprises.com/article/bricolib-veut-devenir-une-reference-du-marche-de-la-location-doutils-2094581)
- [Consoglobe – louer ou emprunter des outils](https://www.consoglobe.com/?p=84753)

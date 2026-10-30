# Composants de Zouti

Produit avec `/replica-design` le 2026-10-30.

Les rôles de couleur viennent de `tokens.json`. Les classes (`btn-primary`, `card`, `input`…) sont définies dans `src/app/globals.css`, les composants React dans `src/components/`. Démonstration isolée : la page `/design` (non indexée).

Écrans : voir les identifiants S01 à S14 dans `recon.md`. Dans Zouti :
- S01 accueil, S02 recherche, S04 annonce, S05 réservation ;
- S06 connexion et inscription, S07 publication d'annonce, S08 réservations, S09 messagerie ;
- S12 avis, S13 aide et FAQ ;
- les écrans de compte en plus.

Règles communes à tous les composants :
- **Focus visible :** contour de 2 px couleur `accent`, décalé de 2 px (`:focus-visible` global).
- **Désactivé :** opacité 60 % et curseur interdit.
- **Cibles tactiles :** 40 px minimum, 44 px dans la barre d'onglets.

## Bouton

- **variantes :**
  - `btn-primary` : fond `accent`, texte `on-accent` ;
  - `btn-secondary` : fond `surface`, bordure `border` ;
  - `btn-sun` : fond `sun`, texte `on-sun` ;
  - `btn-danger` : texte `danger` sur `surface` ;
  - `btn-ghost` : texte `text-muted`.
- **tailles :** md 40 px (`py-2.5`, police 14/600), lg 48 px (`py-3`, police 16).
- **états :**
  - repos, survol (`accent-strong`), focus visible, désactivé ;
  - chargement : `SubmitButton`, libellé remplacé par `pendingLabel` et `aria-busy`.
- **tokens :** rayon md (12 px), police sm/600.
- **accessibilité :**
  - vrai `<button>`, ou `<a>` quand c'est une navigation ;
  - une confirmation (`confirm()`) protège les actions irréversibles : remise, retour, suppression ;
  - le chargement garde un libellé lisible.
- **utilisé sur :** tous les écrans.

## Champ de saisie (input, select, textarea)

- **classe :** `input`.
- **états :**
  - repos : bordure `border-input`, contraste 3,56:1 ;
  - focus : bordure `accent` + halo `accent`/20 ;
  - désactivé : fond `bg` ;
  - erreur : `aria-invalid` donne une bordure et un halo `danger`, et `aria-describedby` pointe vers le message ;
  - vide : texte d'exemple `text-muted`/70.
- **tokens :** rayon md, police 15 px, padding 10 × 14 px.
- **accessibilité :**
  - toujours une `<label>` (`label`) ;
  - aide en `hint` (12 px `text-muted`) ;
  - erreur en `field-error` (12 px/500 `danger`) ;
  - le formulaire ne se vide pas en cas d'erreur (`useActionForm`).
- **utilisé sur :** S02, S05, S06, S07, S09, compte.

## Carte

- **classe :** `card`.
- **tokens :** fond `surface`, bordure `border`, rayon lg (16 px), ombre `card`.
- **variante :** survol `border` accent pour les cartes cliquables.
- **utilisé sur :** partout.

## Carte d'annonce (`ListingCard`)

- **contenu :**
  - photo 4:3 en miniature, avec chargement différé sauf pour les 4 premières ;
  - badge « Livraison possible » ;
  - titre sur une ligne, note ou « Nouveau » ;
  - commune, quartier, distance ;
  - prix par jour et par semaine.
- **états :**
  - sans photo : l'icône de la catégorie ;
  - survol : zoom de la photo à 103 % et titre souligné.
- **accessibilité :** toute la carte est un lien ; l'image a un `alt` vide (titre déjà présent).
- **utilisé sur :** S01, S02, favoris, profil, S04 (« autres annonces »).

## Badge

- **variantes :**
  - `green` : `accent-text` sur `surface-accent` ;
  - `yellow` : `sun-text` sur `surface-sun`, corrigé à 4,79:1 ;
  - `red` : `danger` sur `danger`/10 ;
  - `neutral`.
- **utilisé sur :**
  - statut de réservation (S08) ;
  - catégorie (S04) ;
  - modération (admin) ;
  - badges de confiance (profil).

## Alerte (`Alert`)

- **variantes :** info, succès, avertissement, erreur.
- **accessibilité :** `role="alert"` pour une erreur, `role="status"` sinon.
- **utilisé sur :** formulaires, S04 (annonce publiée), S08, compte.

## Avatar

- **variantes :** photo (miniature ronde), ou initiales sur `surface-accent`.
- **tailles :** 32, 36, 40, 44, 48, 52, 64, 80, 96 px.
- **utilisé sur :** en-tête, S04, S08, S09, profils, avis.

## Étoiles (`Stars`) et saisie de note

- **affichage :**
  - « ★ 4,8 (12) » ;
  - « Nouveau » sans avis ;
  - « sur 5 » pour les lecteurs d'écran.
- **saisie :** 5 radios masquées, avec un libellé pour chaque étoile (« 4 étoiles »).
- **utilisé sur :** S02, S04, S08 (avis), profils.

## Sélecteur de dates

- **composant :** `<input type="date">` natif (début et fin incluse).
- **règles :** `min` = aujourd'hui en Guyane ; la fin suit le début ; durée minimale.
- **états :**
  - conflit avec une période indisponible : message `danger` ;
  - durée trop courte ou trop longue ;
  - liste « Déjà indisponible ».
- **utilisé sur :** S05, disponibilités, filtres S02.

## Récapitulatif de prix

- **contenu :**
  - jours × prix, ou semaines + jours ;
  - économie du tarif semaine ;
  - frais de service (paiement en ligne seulement) ;
  - total « à régler sur place » ou « payé en ligne » ;
  - caution à part.
- **utilisé sur :** S05, S08.

## Étapes de réservation

- **contenu :** 4 segments (Demande, Confirmée, Remise, Rendue) en `accent`, le reste en `border`.
- **accessibilité :** liste `aria-label="Étapes"`.
- **utilisé sur :** S08.

## Bulle de message

- **variantes :**
  - moi : `accent` / `on-accent`, coin bas droit plat ;
  - l'autre : `surface` + bordure ;
  - système : `surface-sun`, centrée, 12 px.
- **séparateurs :** date par jour.
- **accessibilité :** zone `aria-live="polite"`.
- **utilisé sur :** S09.

## Navigation

- **barre d'onglets (mobile) :**
  - 5 onglets ;
  - pastille `danger` pour les messages non lus et les demandes reçues ;
  - `aria-current="page"`.
- **en-tête (bureau) :** recherche, « Proposer un outil » (`btn-sun`), cloche de notifications.
- **utilisé sur :** tous les écrans.

## État vide (`EmptyState`)

- **contenu :** icône, titre, une phrase, une action.
- **utilisé sur :** S01, S02, S08, S09, favoris, notifications, compte.

## Ajout de photos (`PhotoInput`)

- **états :**
  - vide : tuile « Ajouter » ;
  - préparation : ⏳ « Préparation… » ;
  - aperçus, avec badge « Couverture » sur la première photo ;
  - retirer une photo (bouton `aria-label`) ;
  - limite de 6 photos.
- **comportement :** les photos sont réduites dans le navigateur (1 800 px, JPEG 85 %).
- **utilisé sur :** S07, profil, et l'état des lieux en photos à venir (fix 1).

## Carte géographique

- **variantes :** zone approximative (cercle de 600 m), pastilles de prix, sélecteur de point.
- **tokens :** pastille de prix en `surface`, `text`, `border`, ombre `pop`.
- **limite :** le cercle Leaflet est un attribut SVG ; il garde la couleur `accent` en dur.
- **utilisé sur :** S02, S04, S07.

## Exceptions aux tokens (couleurs en dur, volontaires)

- **Logo** (`logo.tsx`, `icon.svg`, icônes PNG) : c'est un fichier de marque.
- **`manifest.ts` et `layout.tsx` (`themeColor`)** : les navigateurs exigent des valeurs littérales.
- **E-mails** (`src/lib/email.ts`) : les messageries ne gèrent pas les variables CSS.
- **Cercle de la carte Leaflet** : voir ci-dessus.

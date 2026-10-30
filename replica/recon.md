# Recon map : Bricolib (web + iOS/Android)

- **Périmètre :** la boucle principale de location d'outils entre particuliers (chercher, réserver, payer, remettre, rendre, noter), côté locataire et côté loueur.
- **Pour :** Zouti, la version guyanaise. Elle est déjà construite dans ce dépôt : cette carte sert à mesurer l'écart et à planifier la suite.
- **Date :** 2026-10-30.
- **Méthode :** sources publiques uniquement, sans compte Bricolib ni connexion. Pas de capture d'écran de l'original : mon environnement bloque l'affichage du site, donc `replica/screens/` est vide et `/replica-diff` ne pourra comparer que les fonctionnalités, pas les mises en page.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | site (accueil) | https://bricolib.net/ | promesse, chiffres (152K+ membres, 83K+ outils), FAQ, catégories, pages villes |
| 2 | page loueur | https://bricolib.net/devenir-loueur | parcours loueur, commission payée par le locataire, Lemonway, contrat, seuil 9 274 € sans SIRET |
| 3 | centre d'aide | https://bricolib.net/centre-aide | 7 rubriques |
| 4 | aide locataire | https://bricolib.net/centre-aide/aide-locataire | 21 articles (liste des fonctions côté locataire) |
| 5 | aide loueur | https://bricolib.net/centre-aide/aide-loueur | 37 articles (liste des fonctions côté loueur) |
| 6 | paiement & remboursement | https://bricolib.net/centre-aide/paiement-et-remboursement | 7 articles |
| 7 | problèmes & litiges | https://bricolib.net/centre-aide/problemes-et-litiges | 7 articles |
| 8 | frais et délais | https://bricolib.net/centre-aide/frais-et-delais-de-paiement | 15 % + 2 € HT (standard) ou 25 % + 2 € HT (annulation flexible), payés par le locataire ; empreinte puis débit à l'acceptation ; 1 retrait gratuit / 30 j |
| 9 | garantie casse & vol | https://bricolib.net/centre-aide/protection-bricolib-garantie-casse-et-vol | assurance Tulip incluse, activée par le code de confirmation, franchise 10 % (min 10 €), non-restitution exclue |
| 10 | déroulé d'une location | https://bricolib.net/centre-aide/comment-se-deroule-une-location | 5 étapes, code de paiement saisi par le loueur, versement J+1 |
| 11 | taux de réactivité | https://bricolib.net/centre-aide/quest-ce-que-le-taux-de-reactivite-de-mon-compte | réponse sous 24 h sinon expiration ; 10 dernières demandes ; 5 niveaux ; classement de recherche |
| 12 | fiche App Store | https://apps.apple.com/fr/app/bricolib/id6468510027 | page non lisible depuis mon environnement ; avis lus via le flux RSS officiel |
| 13 | avis utilisateurs | `replica/reviews.csv` | 79 avis (App Store + Trustpilot), voir `replica/fixes.md` |

Non lus : les CGU complètes (la page a renvoyé du vide), la fiche Google Play, les vidéos de démonstration.

## Boucle principale

Un particulier trouve un outil près de chez lui. Il le réserve en payant par carte (empreinte, puis débit quand le loueur accepte). Il le récupère en donnant un code de confirmation, qui déclenche le paiement du loueur et la garantie casse & vol. Puis il le rend et laisse un avis.

## Écrans

Routes vues dans les liens publics ou déduites des articles d'aide ; « déduit » = non vu directement.

| ID | écran | route / accès | rôle | composants clés | états vus |
| --- | --- | --- | --- | --- | --- |
| S01 | Accueil | `/` | promesse, recherche, outils populaires | barre de recherche + « les plus demandés », chiffres, logos presse, FAQ, liens villes | rempli |
| S02 | Recherche | `/recherche?tool=…` | trouver un outil près de soi | filtres outil + localisation, liste d'annonces, tri par réactivité (déduit) | (rendu JS, non vu) |
| S03 | Pages SEO ville / catégorie | `/location-outil/{ville-cp}`, `/location-outil/{catégorie}`, `/rayon-…` | référencement | liste filtrée | rempli |
| S04 | Annonce | déduit depuis S02 | détail outil, prix, caution, dispo, loueur | photos, prix/jour, caution, calendrier, profil et réactivité du loueur, bouton réserver | déduit |
| S05 | Réservation / paiement | déduit | choisir dates, formule standard ou flexible, payer | sélecteur de dates, choix de formule, détail « taxes et frais », paiement CB (empreinte) | déduit |
| S06 | Connexion / inscription | `/connexion`, `/inscription` | compte | e-mail, mot de passe | rempli ; erreurs signalées dans les avis |
| S07 | Déposer une annonce | `/deposer-annonce` | publier un outil | photo(s), type d'outil (catalogue), tarif, dispos, localisation, caution | déduit |
| S08 | Mes transactions | `/compte/transactions` | suivre réservations et locations | liste, statuts, accepter/refuser, code de confirmation, annuler, litige | déduit |
| S09 | Messagerie | `/compte/messagerie` | échanger, déclarer un sinistre | fil par transaction, lien de déclaration Tulip | déduit |
| S10 | Porte-monnaie | `/compte/porte-monnaie` | solde loueur, retraits | solde, prochain retrait gratuit, IBAN | déduit |
| S11 | Vérification d'identité | déduit (Onfido via Lemonway) | KYC du loueur avant d'encaisser | upload de pièce d'identité, selfie | erreurs signalées dans les avis |
| S12 | Laisser un avis | `/avis`, article « Comment ajouter un avis » | noter | étoiles, texte | déduit |
| S13 | Centre d'aide + chat | `/centre-aide`, `/assistance` | support 7 j/7, 9 h–20 h | articles, chat (robot puis humain) | rempli |
| S14 | Page loueur (landing) | `/devenir-loueur` | recruter des loueurs | arguments, FAQ, chiffres | rempli |

## Parcours

```
F01 Le locataire loue un outil
    S01/S02 recherche -> S04 annonce -> S05 dates + formule + CB (empreinte) -> attente (24 h max)
    -> acceptation : débit + coordonnées -> remise : il donne son code de confirmation -> fin J+1 -> S12 avis
    clics du parcours idéal : environ 8 (estimation, sans compte)
    cas limites : pas de réponse en 24 h (expiration, empreinte libérée), loueur accepte puis indisponible,
      annulation (frais selon la formule), outil ne correspond pas, carte refusée (3-D Secure)

F02 Le loueur publie un outil
    S06 inscription -> S07 annonce (photo, tarif, dispos) -> publication
    -> S11 vérification d'identité (Lemonway/Onfido) exigée pour répondre ou encaisser
    cas limites : documents refusés, RIB non validé (signalé dans les avis)

F03 Le loueur traite une demande
    e-mail de demande -> S08 accepter / refuser sous 24 h -> rendez-vous -> saisir le code du locataire à la remise
    cas limites : pas de réponse (expiration, baisse de réactivité et de classement), réservation trop tardive

F04 Annuler
    S08 annuler -> remboursement intégral si refus/expiration ; frais selon la formule si le locataire annule après débit
    cas limites : loueur accepte puis n'a pas l'outil, remboursement sur porte-monnaie au lieu de la carte

F05 Casse ou vol
    S09 le loueur déclare via le lien Tulip (5 j ouvrés casse, 2 j vol) -> photos, plainte -> instruction Tulip
    franchise 10 % (min 10 €) au locataire ; non-restitution non couverte

F06 Le loueur retire son argent
    S10 porte-monnaie -> retrait vers IBAN (1 gratuit / 30 j, puis 2 €)

F07 Litige
    S08 déclarer un litige -> support -> remboursement ou arbitrage
```

## Composants

| composant | variantes | états | utilisé sur |
| --- | --- | --- | --- |
| Barre de recherche outil + lieu | accueil, en-tête | vide, suggestions « les plus demandés » | S01, S02 |
| Carte d'annonce | liste, grille | avec photo | S01, S02, S03 |
| Sélecteur de dates | — | indisponible, sélection | S04, S05 |
| Choix de formule | standard, annulation flexible | sélectionnée | S05 |
| Récapitulatif prix « taxes et frais » | — | — | S05 |
| Badge de réactivité | 5 niveaux | — | S04, S08 |
| Code de confirmation | affichage (locataire), saisie (loueur) | valide, invalide | S08 |
| Fil de messagerie | par transaction | non lu | S09 |
| Solde / retrait | — | retrait gratuit disponible ou non | S10 |
| Étoiles d'avis | saisie, affichage | — | S04, S12 |

## Modèle de données déduit

```
User         id, email, nom, téléphone, localisation, statut KYC, réactivité (10 dernières demandes), solde porte-monnaie, IBAN
             preuves : S10, S11, article réactivité          confiance : haute
Listing      id, owner_id, type d'outil (catalogue ~500 outils / 80+ catégories), photos[], prix/jour, caution,
             localisation, disponibilités, statut (en ligne, pause/vacances), assurable (non pour les engins autoportés)
             preuves : S01 « plus de 500 outils », S07, article garantie          confiance : moyenne
Booking      id, listing_id, renter_id, owner_id, dates, formule (standard | flexible), frais de service,
             statut (demandée | acceptée | refusée | expirée | annulée | en cours | terminée | litige),
             empreinte_id, débit, code de confirmation, garantie activée à, versement J+1
             preuves : articles frais, déroulé, garantie          confiance : haute
Message      id, booking_id, auteur, texte, date          preuves : S09          confiance : haute
Review       id, booking_id, auteur, cible, note, texte          preuves : S12          confiance : moyenne
Withdrawal   id, user_id, montant, frais (0 ou 2 €), date          preuves : article frais          confiance : haute
Claim        id, booking_id, type (casse | vol), statut Tulip (soumis | en cours | attente infos | clôturé), pièces
             preuves : article garantie          confiance : haute
Dispute      id, booking_id, motif, statut          preuves : article litige (titre seul)          confiance : supposition
```

Relations : User 1-n Listing ; Listing 1-n Booking ; Booking 1-n Message ; Booking 0-2 Review ; Booking 0-1 Claim ; User 1-n Withdrawal.

## Tableau des fonctionnalités

Voir `features.csv` : 43 lignes au total.

| | must | should | could | skip |
| --- | --- | --- | --- | --- |
| Fonctions de Bricolib (32 lignes) | 14 | 10 | 5 | 3 |
| Corrections Zouti (11 lignes, `original = no`) | | | | |

Les corrections Zouti viennent de replica-entrepreneur et ne comptent pas dans le score de parité.

## Hors périmètre (impossible ou à ne pas cloner)

- **Le réseau** (152K+ membres, 83K+ outils) et ses avis : Zouti doit construire sa propre communauté guyanaise.
- **Le partenariat d'assurance Tulip** (garantie casse & vol) : c'est un contrat commercial, à négocier par Zouti avec un assureur.
- **L'agrément de paiement Lemonway** et le portefeuille réglementé : Zouti s'appuie sur Stripe Connect (ou le paiement en main propre).
- **La marque, les logos presse et les textes** de Bricolib.

## Taille

| Mesure | Nombre |
| --- | --- |
| Écrans | 14 |
| Parcours | 7 |
| Entités | 8 |

**Points durs :**
- paiement en deux temps (empreinte puis débit) avec versement au loueur ;
- code de confirmation lié à la garantie ;
- vérification d'identité des loueurs ;
- double réservation évitée en base ;
- réactivité qui influence le classement.

**Taille : M.** La majorité est déjà construite dans Zouti ; il reste quelques semaines pour les écarts listés dans `features.csv`.

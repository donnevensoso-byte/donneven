# Rentabiliser Zouti

Date : 2026-11-03. Principe de base : **ne jamais casser la promesse « 0 % de commission en main propre »**. C'est l'argument qui fait venir les gens ; on gagne de l'argent sur ce qui est **en plus** (sécurité, visibilité, services, partenaires), jamais sur l'échange de base.

Les montants sont des ordres de grandeur pour se repérer, pas des promesses.

## Court terme (0 à 6 mois) : premiers euros, peu de développement

| # | idée | comment | ordre de grandeur | à surveiller |
| --- | --- | --- | --- | --- |
| 1 | **Aides et financements de démarrage** | ACRE (exonération partielle de cotisations la 1re année), prêt d'honneur Initiative Guyane, microcrédit ADIE, Bourse French Tech de Bpifrance, appels à projets économie circulaire ou ESS (CTG, ADEME, Politique de la ville) | de quelques milliers à plusieurs dizaines de milliers d'euros, souvent à taux zéro | dossiers à monter. Zouti coche « économie circulaire », « pouvoir d'achat » et « lien social », de bons arguments |
| 2 | **Partenaires locaux** (encarts « Partenaire ») | quincailleries, magasins de motoculture, réparateurs de petits moteurs, loueurs pros. Un encart fixe sur la recherche et les annonces de leur catégorie, plus une mention sur Instagram | 50 à 150 € par mois et par partenaire | pas de pistage publicitaire (pas de cookies, donc pas de bandeau) : un simple encart |
| 3 | **Affiliation consommables** | « Pensez au fil de débroussailleuse, à l'huile 2 temps… » avec un lien vers un magasin partenaire, en commission ou en code promo | petit, quelques % des ventes | lien clairement indiqué comme partenaire |
| 4 | **Paiement par carte avec frais de service** (déjà programmé) | optionnel : le locataire qui veut payer par carte paie 10 % de frais. Ajouter un **minimum de 1,50 €** | exemple : 100 locations par carte par mois à 30 € = 300 € bruts, environ 150 à 200 € après les frais Stripe | passe de test Stripe d'abord. Les frais Stripe Connect mangent la marge sur les petites locations |

## Moyen terme (6 à 18 mois) : quand il y a du trafic

| # | idée | comment | ordre de grandeur | à surveiller |
| --- | --- | --- | --- | --- |
| 5 | **Mise en avant d'annonce** | « Remonter en tête » pendant 7 jours pour 2 à 3 €, avec le badge **« Sponsorisé »** | 2 à 3 € × quelques centaines par mois | **il faut modifier les CGU** : elles disent aujourd'hui qu'aucun propriétaire ne paie pour son classement. La loi impose d'indiquer clairement les annonces payées |
| 6 | **Caution sécurisée par carte** | au lieu d'une caution en espèces, une empreinte bancaire bloquée pendant la location et libérée au retour. Le service coûte 1,50 à 3 € au locataire | très apprécié pour le matériel cher (groupe, bétonnière) | se développe sur la base Stripe existante |
| 7 | **Garantie casse en partenariat avec un assureur** | une option de quelques euros par location, couverte par un assureur. Zouti touche une commission | souvent la meilleure source de revenus des plateformes de location | **réglementé** : il faut s'inscrire à l'ORIAS comme intermédiaire, ou passer par une assurtech qui porte le contrat |
| 8 | **Abonnement « Zouti+ » pour les gros propriétaires** | 5 à 10 € par mois : statistiques, annonces illimitées en tête une fois par mois, calendrier synchronisé, badge « Propriétaire régulier » | dépend du nombre de propriétaires actifs | ne rien retirer à l'offre gratuite |
| 9 | **Comptes professionnels** | loueurs pros, artisans, associations : 15 à 30 € par mois, plusieurs annonces, badge Pro, factures | quelques centaines d'euros par mois avec 10 à 20 pros | aujourd'hui les CGU réservent l'inscription aux particuliers : **il faut des CGU pros** (obligations légales différentes) |
| 10 | **Livraison du matériel** | mise en relation avec des livreurs ou des jeunes du quartier pour livrer un groupe ou un barnum, avec une commission sur la course | 2 à 5 € par livraison | assurance du transport, statut des livreurs |

## Long terme (18 mois et plus) : changer d'échelle

| # | idée | comment |
| --- | --- | --- |
| 11 | **Les Antilles et l'océan Indien** | « zouti » veut aussi dire « outils » en créole antillais : Martinique, Guadeloupe, puis La Réunion. Même site, nouvelles communes, des domaines comme `zouti972.fr` ou `zouti971.fr` |
| 12 | **Une offre pour les collectivités et les bailleurs sociaux** | une « outilthèque de quartier » en marque blanche, payée par une mairie, un bailleur ou la CTG (abonnement annuel, plusieurs milliers d'euros par an) |
| 13 | **L'événementiel** | une rubrique fêtes (barnums, tables, sono, éclairage) avec des packs et des partenaires traiteurs. Gros paniers, forte saisonnalité |
| 14 | **Les applications mobiles** | fiches App Store et Google Play déjà prêtes : plus de visibilité, notifications |
| 15 | **Revendre ou licencier la plateforme** | une place de marché locale qui marche peut intéresser un acteur national, un réseau de magasins ou un assureur |

## Ce qu'on ne fait pas

- **Vendre les données des membres** : interdit sans consentement (RGPD) et destructeur pour la confiance.
- **Faire payer pour poser une question** ou **prendre une commission en main propre** : ce serait trahir la promesse de départ.
- **De fausses annonces ou de faux avis** pour paraître plus gros.

## L'ordre conseillé

1. **Maintenant** : les aides (1) et 2 ou 3 partenaires locaux (2). C'est de l'argent sans toucher au produit.
2. **Dès 50 locations par mois** : le paiement par carte (4) et la caution sécurisée (6).
3. **Dès 300 à 500 annonces actives** : la mise en avant (5), avec les CGU mises à jour, et l'abonnement Zouti+ (8).
4. **Avec un assureur partenaire** : la garantie casse (7).
5. **Une fois la Guyane bien couverte** : les Antilles (11) et les collectivités (12).

## Côté statut

- **Micro-entreprise** : surveiller le plafond de chiffre d'affaires des prestations de services et le seuil de franchise de TVA (les montants changent : à vérifier chaque année sur urssaf.fr et impots.gouv.fr).
- **Encaisser pour le compte des membres** (carte) crée des obligations de déclaration (article 242 bis du CGI). Les faire valider par un comptable avant d'activer la carte.
- Si les revenus montent, passer en **SASU** ou en **EURL** permet de lever des fonds et d'accueillir des associés.

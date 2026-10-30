# Parité : Zouti face à Bricolib

Date : 2026-10-30. Build : 9097fdc. Matrice : `replica/features.csv`, outil `parity.py`.

## Verdict : mieux que l'original (sous réserve du paiement en ligne réel)

- Les 14 fonctions indispensables sont faites, avec un score fonctionnel de **80,6 / 100**. Aucun bug S1 ou S2 n'est ouvert, seul un S4 l'est (`replica/bugs.md`) : Zouti est donc **livrable**.
- Les correctifs tirés des avis (`replica/fixes.md`) sont presque tous livrés : 7 sur 8, mais pas les notifications push. Les seuils de la grille « mieux que l'original » sont donc atteints.
- **Réserve honnête :** le paiement par carte n'a été testé qu'avec un Stripe simulé, que ce soit l'empreinte, le débit, le versement à la remise ou le remboursement. Avant d'activer le paiement en ligne, il faut faire la passe manuelle avec de vraies clés de test (`replica/test-plan.md`). Sans Stripe, Zouti fonctionne entièrement en paiement en main propre.

## Les scores

| | score |
| --- | --- |
| Fonctionnel (pondéré : indispensable 3, utile 2, bonus 1 ; partiel = moitié) | **80,6** (au départ 67,9, puis 73,9 après `/replica-build`) |
| Indispensables | **14 sur 14** |
| Mise en page | **non mesurée** : aucune capture de l'original. L'environnement de travail ne peut pas afficher bricolib.net ni la fiche App Store, donc `replica/screens/` est vide et `imgdiff.py` n'a rien à comparer. Les captures de Zouti sont dans `replica/clone-screens/`. |

Par domaine, du plus faible au plus fort : support 0 · confiance 50 · plateformes 50 · acquisition 67 · compte 75 · paiement 78 · annonces 82 · réservation 90 · recherche 100 · messagerie 100 · avis 100.

## Ce que cette passe a ajouté

| fonction | avant | après |
| --- | --- | --- |
| Versement au loueur après la remise (indispensable) | partiel | oui : virement Stripe déclenché par le code de remise, nouvel essai en cas d'échec, liste « Vos versements » |
| Classement par réactivité du loueur | partiel | oui : tri « Recommandées » par défaut |
| Pages par commune et catégorie | partiel | oui : `/location-outils/…`, noindex si vide |
| Litige depuis la réservation | partiel | oui : formulaire, autre partie prévenue, l'équipe ouvre contrat et photos |
| Fix 2 : relances et plan B | partiel | oui : rappel au loueur 12 h avant l'expiration, délai de réponse affiché, annonces libres proposées |
| Fix 3 : règles d'annulation avant la demande | partiel | oui, avec la date limite exacte |
| Fix 4, 5, 6 : rayon en km, heures de remise et de retour, délai de prévenance | non | oui |

## Ce qui manque encore, dans l'ordre de construction

1. **Changer la date d'une réservation** (utile). Aujourd'hui, il faut annuler et refaire une demande.
2. **Vérification d'identité des loueurs** (utile). Stripe Identity peut s'en charger quand le paiement en ligne sera actif. Elle a été source de plaintes chez l'original : à garder facultative et rapide.
3. **Applications iOS et Android** (utile, partiel). La PWA s'installe déjà ; les apps natives et les notifications push (fix 8) viendront ensemble.
4. **Porte-monnaie et retrait vers IBAN** (utile, partiel). Stripe Express verse directement sur le compte du loueur. Un porte-monnaie interne n'apporterait que de la réglementation : à garder ainsi.
5. **Déclaration de sinistre avec assurance** (utile, partiel). Il faut un contrat d'assurance, pas du code.
6. **Catalogue normalisé de 500 outils** (utile). Titre libre et 13 catégories suffisent tant que l'offre en Guyane reste petite.

En bonus, sans urgence : blog de conseils, comptes professionnels, chat d'assistance 7 j/7 (une question d'équipe), formule « annulation flexible » payante (sans objet sans commission).

## Différences de comportement

| parcours | l'original | Zouti | à corriger ou garder |
| --- | --- | --- | --- |
| F01 louer | environ 8 clics, carte obligatoire, contact payant | 5 clics en main propre (recherche, annonce, début, fin, demander) ; un de plus en ligne (page d'empreinte) ; question gratuite avant toute demande | garder (angle A) |
| F01 sans réponse | expiration après 24 h, le locataire recommence de zéro | rappel au loueur 12 h avant ; après refus ou expiration, annonces libres aux mêmes dates | garder (fix 2) |
| F01 annulation | règles dans l'aide, frais selon la formule | règles et date limite dans le module de réservation, annulation gratuite jusqu'à la veille | garder (fix 3) |
| F03 remise | le locataire donne un code, qui déclenche paiement et garantie | même principe : le code de remise déclenche le versement en ligne ; photos datées des deux côtés, reprises dans le contrat | garder |
| F05 casse | assurance Tulip, déclaration externe | état des lieux en photos et litige déclaré dans l'app, pas d'assurance intégrée | garder ; l'assurance est un partenariat à négocier |
| F06 retrait | porte-monnaie, 1 retrait gratuit par mois | versement automatique sur le compte bancaire via Stripe, sans porte-monnaie | garder |
| F07 litige | via le support | depuis la réservation, avec trace dans la conversation | garder |
| E-mails | confirmation, demande, rappels | les mêmes ; sans SMTP, ils sont seulement écrits dans les journaux | brancher un SMTP avant le lancement (`/replica-deploy`) |
| Mémoire entre visites | compte, favoris | compte, favoris, filtres dans l'URL | garder |

## Les cinq prochaines choses à faire

1. Passe manuelle Stripe en mode test : empreinte, carte refusée, débit, versement à la remise, remboursement, webhook rejoué.
2. Brancher un SMTP réel et l'appel de `/api/cron` toutes les 15 minutes. C'est là que vivent les rappels aux loueurs.
3. Changer la date d'une réservation.
4. Notifications push sur la PWA (fix 8).
5. Vérification d'identité facultative pour les loueurs en paiement en ligne.

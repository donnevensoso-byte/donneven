# Plan de test : Zouti

Build : 67d7d9c  Date : 2026-10-30  Env : local, `next start`, Postgres `zouti_e2e` vidée à chaque passage,
Chromium « Pixel 7 » (412 px), fuseau America/Cayenne, Stripe désactivé.

Chaque spec échoue sur une erreur console, une réponse 5xx (`tests/e2e/fixtures.ts`) et, là où c'est indiqué,
sur toute violation axe WCAG 2.1 A/AA. Les comptes et annonces de départ sont créés directement en base
(les limites anti-abus de l'inscription bloqueraient sinon la suite).

Parcours de `recon.md` adaptés à Zouti : F05 (casse ou vol) passe par l'état des lieux en photos, faute
d'assurance intégrée ; F06 (retrait) par Stripe Express, désactivé en local ; F07 (litige) par le signalement
traité par l'équipe.

| cas | parcours | type | étapes | attendu | auto | résultat |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | louer un outil | heureux | inscription, annonce, recherche, demande, acceptation, message, photo, code faux puis bon, retour, avis croisés | location terminée, avis visibles sur l'annonce | e2e `rental-flow` | ok |
| F01-E1 | | recherche vide | `/recherche?q=…` sans résultat | état vide + lien « Proposer ce matériel », axe propre | e2e | ok |
| F01-E2 | | accents et emoji | recherche « débroussailleuse échelle », puis « 🌿 » | l'annonce accentuée est trouvée, pas d'erreur | e2e | ok |
| F01-E3 | | deux onglets | même demande envoyée au même instant depuis deux onglets | une seule réservation, une seule conversation | e2e | **échec → BUG-006** |
| F01-E4 | | double clic | double clic sur « Demander à réserver » | une seule réservation | e2e | ok |
| F01-E5 | | dates prises | demande qui chevauche une location acceptée | message clair, aucune demande créée | e2e | ok |
| F01-E6 | | message long, accents, emoji | message de ~700 caractères | conservé tel quel dans la conversation, axe propre | e2e | **échec axe → BUG-007** |
| F01-E7 | | données d'un autre | un tiers ouvre la réservation, le contrat, ses messages ; un visiteur l'ouvre | 404, rien dans ses messages, visiteur renvoyé à la connexion | e2e | ok |
| F01-E8 | | session expirée | cookie invalide sur une réservation, reconnexion | retour sur la réservation | e2e | ok |
| F01-E9 | | clavier seul | dates au clavier, Tab jusqu'au bouton, Entrée | demande envoyée, page suivante accessible | e2e | **échec axe → BUG-001** |
| F01-E10 | | requêtes simultanées | 3 `requestBooking` identiques en parallèle | une seule réservation | intégration `races` | ok |
| F01-E11 | | premier contact simultané | 2 demandes de dates différentes en parallèle | une seule conversation | intégration | ok |
| F01-N1 | | son propre matériel | le loueur ouvre sa propre annonce | pas de bouton de demande | e2e | ok |
| F01-N2 | | mauvais mot de passe | connexion avec un faux mot de passe | message, reste sur `/connexion` | e2e | ok |
| F01-N3 | | date passée | contournement du `min` du champ date | refus serveur « déjà passée » | e2e | ok |
| F01-N4 | | carte refusée | carte `4000 0000 0000 0002` sur l'empreinte | message, pas de demande transmise | manuel (Stripe test) | à faire |
| F02-H1 | publier un outil | heureux | photo, titre avec emoji, prix décimal 8,50, publier | annonce en ligne, titre et **prix visibles** | e2e | **échec → BUG-002** |
| F02-E1 | | formulaire vide | publier sans rien remplir | erreurs par champ, `aria-invalid` + `aria-describedby` | e2e | ok |
| F02-E2 | | sans photo | tout remplir sauf la photo | refus « au moins une photo », champs conservés | e2e | ok |
| F02-E3 | | saisie longue, prix absurde | titre > 80 caractères, prix -5 | titre coupé à 80, prix refusé puis corrigé | e2e | ok |
| F02-E4 | | pause | mettre en pause, chercher | absente de la recherche | e2e | ok |
| F02-E5 | | anti-abus | 11 inscriptions depuis la même IP réelle, en-tête X-Forwarded-For falsifié | la 11e est refusée | e2e | **échec → BUG-003** |
| F02-N1 | | annonce d'un autre | `/annonces/{id}/modifier` par un tiers | 404, pas de bouton de gestion | e2e | ok |
| F02-N2 | | visiteur | `/annonces/nouvelle` sans compte | renvoi vers la connexion avec retour | e2e | ok |
| F03-H1 | traiter une demande | heureux | accepter, puis code de remise | voir F01-H1 | e2e | ok |
| F03-H2 | | refus motivé | refuser avec motif | le locataire voit « Refusée » et le motif | e2e | **échec axe → BUG-001** |
| F03-E1 | | demandes concurrentes | accepter A quand B chevauche | B refusée automatiquement | e2e | ok |
| F03-E2 | | onglet périmé | accepter dans un onglet, refuser dans l'autre | « déjà été traitée », reste acceptée | e2e | ok |
| F03-E3 | | code deviné | 5 codes faux puis le bon | blocage 15 min, le bon code refusé pendant le blocage | e2e | ok |
| F03-E4 | | remise trop tôt | réservation dans 10 jours | pas de saisie de code | e2e | ok |
| F03-E5 | | acceptations simultanées | accepter A et B (chevauchement) en parallèle | une seule acceptée | intégration | ok |
| F03-N1 | | mauvais rôle | le locataire sur sa demande | ni « Accepter » ni saisie de code, voit son code | e2e | ok |
| F04-H1 | annuler | locataire, demande en attente | annuler avec motif | « Annulée », axe propre | e2e | **échec axe → BUG-001** |
| F04-H2 | | loueur, réservation confirmée | annuler | le locataire voit le motif, les dates se libèrent | e2e | ok |
| F04-E1 | | location commencée | après la remise | plus de bouton d'annulation | e2e | ok |
| F04-E2 | | retour arrière | annuler, page précédente, recharger | pas de seconde annulation possible | e2e | ok |
| F04-E3 | | accepter et annuler en même temps | en parallèle | état final cohérent | intégration | ok |
| F04-N1 | | remboursement réel | annulation après débit | remboursement Stripe | manuel (Stripe test) ; simulé en intégration `payments` | à faire |
| F05-H1 | casse : état des lieux | heureux | 2 photos au retour avec remarque | visibles des deux côtés et dans le contrat | e2e | **échec axe → BUG-001** |
| F05-E1 | | faux fichier | « image » qui n'en est pas une | erreur propre, rien d'enregistré | e2e | ok |
| F05-E2 | | quota | 8 photos puis une 9e | refus clair, toujours 8 | e2e | ok (voir BUG-005) |
| F06-H1 | retrait | sans Stripe | `/compte/paiements` | explique le règlement en main propre | e2e | ok |
| F06-E1 | | espace compte | `/compte` | axe propre | e2e | **échec → BUG-004** |
| F06-N1 | | onboarding Stripe réel | création du compte Express, retour | statut « prêt » | manuel (clés test) | à faire |
| F07-H1 | litige | signalement d'annonce | signaler, l'admin voit et marque traité | badge « Traité » | e2e | ok |
| F07-E1 | | signalement de membre | depuis le profil | confirmation | e2e | ok |
| F07-N1 | | accès admin | membre ordinaire sur `/admin` | renvoyé ailleurs | e2e | ok |

## Passe manuelle (non automatisable ici)

L'environnement de test ne joint ni Stripe, ni un serveur SMTP, ni les tuiles OpenStreetMap. À faire avec
de vraies clés de test, sur la préproduction :

1. Empreinte avec la carte `4242 4242 4242 4242`, acceptation, vérifier le débit et le virement au loueur dans le tableau de bord Stripe.
2. Carte refusée `4000 0000 0000 0002` : message lisible, la demande n'est pas transmise au loueur.
3. Annulation après débit : remboursement visible côté Stripe, frais de service compris.
4. Webhook rejoué deux fois depuis le tableau de bord Stripe : un seul effet.
5. E-mails réels : vérification d'adresse, nouvelle demande, acceptation, rappel ; arrivée en boîte de réception, pas en spam.
6. Carte de l'annonce et de la recherche avec de vraies tuiles.
7. Lecteur d'écran (VoiceOver iOS) sur la réservation et la messagerie.

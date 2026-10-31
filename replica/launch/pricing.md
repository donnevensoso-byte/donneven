# Prix : Zouti

## Ce que font les autres

| service | modèle | prix public | source | lu le |
| --- | --- | --- | --- | --- |
| L'original (location d'outils entre particuliers, France) | commission payée par le locataire, plus des frais de retrait pour le loueur | **15 % + 2 € HT** par location (formule standard) ou **25 % + 2 € HT** (annulation flexible) ; 1 retrait gratuit tous les 30 jours, ensuite 2 € | page « frais et délais de paiement » de son centre d'aide (`replica/recon.md`, source 8) | 2026-10-30 |
| AlloVoisins (services et location entre voisins) | abonnement mensuel ; commission supprimée selon la presse | offre gratuite limitée à 4 réponses par mois, « Pro » annoncé à 29,99 €/mois (**chiffre de blog, à vérifier**) | [Journal des entreprises](https://www.lejournaldesentreprises.com/article/allovoisins-supprime-les-commissions-pour-ses-4-millions-de-membres-1889375), [Espace autoentrepreneur](https://espace-autoentrepreneur.com/ruche/article/allovoisins) | 2026-10-30 |
| Leboncoin (petites annonces) | annonce gratuite, pas de parcours de location d'outils | 0 € pour publier et pour contacter ; pas de contrat, d'état des lieux ni de caution encadrée | [aide et presse](https://iphonesoft.fr/2018/07/24/leboncoin-ajoute-systeme-paiement-entre-particuliers) | 2026-10-30 |
| Groupes Facebook et WhatsApp locaux | gratuit | 0 € ; pas de recherche, ni d'avis, ni de suivi | — | — |

Les prix changent : à relire avant le lancement.

## Ce que disent les utilisateurs de l'original sur le prix (`replica/feedback.md`)

- **Commission et frais trop élevés** : 11 avis (14 %), une seule source (Trustpilot), note moyenne 1,8. Par exemple, une location à 10 € avec 4,20 € de frais pour une simple mise en relation, ou des frais de retrait découverts après coup.
- **Impossible de contacter le loueur sans payer d'avance** : 8 avis (10 %), deux sources.
- **Annulation et remboursement** : 11 avis (14 %), deux sources, dont des frais d'annulation jugés énormes.

## Le modèle de Zouti

Zouti ne vend pas d'abonnement : c'est une place de marché locale, avec deux usages.

| pour qui | prix | ce qui est inclus |
| --- | --- | --- |
| **Voisins qui règlent en main propre** (par défaut) | **0 €**, sans commission ni abonnement | annonces illimitées, messagerie avant toute demande, réservation, code de remise, état des lieux en photos, contrat, avis |
| **Locataires qui paient par carte** (si le propriétaire l'active) | **10 % de frais de service**, payés par le locataire, **sans frais fixes** ; réglable avec `SERVICE_FEE_PERCENT` | empreinte bancaire (débit seulement si le propriétaire accepte), remboursement intégral en cas d'annulation à temps, virement au propriétaire dès la remise, sans frais de retrait |
| **Professionnels** (loueurs, artisans) | **plus tard** : rien n'est construit, à décider avec les premiers pros | — |

**Exemple :** une débroussailleuse à 25 € le week-end coûte 25 € en main propre et 27,50 € par carte. Le propriétaire reçoit 25 € dans les deux cas. Chez l'original, la même location coûterait 25 € + 15 % + 2 € HT, soit environ 32 € TTC.

**La marge, honnêtement.** Stripe prélève environ 1,5 % + 0,25 € sur une carte européenne (à vérifier sur le barème Stripe du compte), payés par Zouti sur ses 10 %. Sur une location à 10 €, Zouti garde donc environ 0,60 €. Sous 5 €, un paiement par carte ne rapporte presque rien : on peut le laisser ainsi au lancement (c'est le prix de la confiance) et ajouter un minimum de frais plus tard si besoin.

## Ce que le produit fait déjà contre les plaintes sur la facturation

- Frais affichés **avant** la demande, dans le détail du prix ; rien en main propre.
- Annulation gratuite jusqu'à la veille, date exacte affichée, remboursement intégral automatique.
- Aucun frais de retrait : Stripe vire directement sur le compte bancaire du propriétaire.
- Pas d'abonnement à résilier, donc pas de piège au renouvellement.

## Stripe : ce que vous devez créer

Aucun produit ni prix à créer : chaque paiement est calculé à la réservation (Checkout avec `price_data`). En revanche, il faut :

1. Un compte Stripe France, activé, avec **Connect** (comptes Express) et les virements séparés (*separate charges and transfers*).
2. Les clés `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` (webhook vers `/api/stripe/webhook`, événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `account.updated`).
3. Vérifier auprès de Stripe que des comptes Express avec une adresse en Guyane (973) peuvent être activés. La Guyane fait partie de la France et de l'UE, mais c'est à confirmer pendant l'inscription d'un premier propriétaire test.
4. La passe manuelle en mode test de `replica/test-plan.md` avant de passer en mode réel.

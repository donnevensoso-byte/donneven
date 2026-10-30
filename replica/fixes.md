# Ce que les utilisateurs de Bricolib reprochent, et ce que Zouti en fait

Produit avec `/replica-entrepreneur` le 2026-10-30.

**Échantillon : 79 avis réels, 2 sources.**
- 26 avis App Store France (flux officiel Apple ; l'avis de « Corentin Henry », aussi publié sur Trustpilot, n'est compté qu'une fois).
- 53 avis Trustpilot visibles sur 59 (pages 1 à 3).
- Pas de fiche Google Play trouvée. Reddit et les forums n'ont pas été lus.

C'est en dessous de l'objectif du skill (100+ avis, 3 sources) : les tendances ci-dessous indiquent une direction, ce ne sont pas des mesures. Données brutes : `reviews.csv`. Classement automatique : `feedback.md` (thèmes en français : `themes-fr.json`).

## 1. Ce qu'ils détestent

| # | Problème | Avis | Sources | Zouti aujourd'hui |
|---|---|---|---|---|
| 1 | L'app ou le site plante, recherche impossible | 12 | 2 | Testé de bout en bout, mais rien n'est encore en ligne |
| 2 | Annulation coûteuse, remboursements qui traînent | 11 | 2 | ✅ Annulation gratuite jusqu'à la veille, aucun prélèvement en main propre |
| 3 | Commission et frais jugés excessifs *(un seul site)* | 11 | 1 | ✅ 0 % sur les locations réglées en main propre |
| 4 | Impossible de poser une question au loueur sans payer d'avance | 8 | 2 | ✅ Bouton « Poser une question » gratuit avant toute demande |
| 5 | Problèmes de connexion et de compte | 8 | 2 | ✅ Session de 60 jours, connexion couverte par le test de bout en bout |
| 6 | Versements aux loueurs bloqués, vérification d'identité pénible *(un seul site)* | 7 | 1 | ✅ Aucune vérification d'identité ni RIB pour publier ou louer en main propre |
| 7 | Loueurs qui ne répondent pas ou ne viennent pas | 7 | 2 | ⚠️ Expiration après 48 h et taux de réponse affiché, mais pas de relance ni d'alternative proposée |
| 8 | Support absent ou désagréable *(un seul site)* | 6 | 1 | Dépend de l'équipe, pas du code |
| 9 | Casse, vol, litige « parole contre parole » | 6 | 2 | ⚠️ Contrat et état des lieux papier seulement |
| 10 | Trop peu de demandes, plateforme « morte » | 5 | 2 | Sujet de lancement, pas de code (`/replica-launch`) |

Citations, avec leur lien :
- Contacter le loueur : « Il faut faire un prépaiement pour poser une question sur l’outil qu’on veut louer au propriétaire , et savoir s’il est disponible ou pas » ([App Store](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-13358746419)) ; « 9,56€ de frais pour poser une question au loueur c est de l arnaque !!! » ([Trustpilot](https://fr.trustpilot.com/reviews/674eaf9763f60fb98f285482))
- Pas de réponse : « 3 loueurs contactés en 3 jours, 3 absences de réponse. » ([App Store](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-13210083569)) ; « J'ai fait deux demandes de location et auucun des loueur n'a répondu, ce qui m'a fait perdre deux jours pour organiser mes travaux. » ([Trustpilot](https://fr.trustpilot.com/reviews/6a1017fd1e1c4021659ab7b7))
- Litiges : « Résultat, c’est parole contre parole, et la plate-forme ne sert strictement à rien dans la gestion du litige. » ([Trustpilot](https://fr.trustpilot.com/reviews/69a145d49a233124e377ad56)) ; « Les cautions par chèque sont nulles, car le chèque provenait d'un compte clôturé. » ([Trustpilot](https://fr.trustpilot.com/reviews/67c82bd74b314e14817efb6a))
- Frais : « Pour une location à 10e avec 4,2e de commission pour juste une mise en relation, je trouve ça abusé. » ([Trustpilot](https://fr.trustpilot.com/reviews/6989e58831766424f4a1c231))
- Annulation : « Et je découvre que les frais d'annulation coûtent 50% de la transaction ! » ([Trustpilot](https://fr.trustpilot.com/reviews/6a4453f0ae3b2ba19c98cbeb))

## 2. Ce qui manque (demandé par les utilisateurs)

Chacune de ces demandes ne repose que sur **1 avis** : elles sont donc *minces*.

- **Un rayon de recherche en km** : « Impossible de choisir un rayon de recherche en Km. » ([App Store](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-13560218573)). Zouti trie par distance, mais n'a pas de filtre par rayon.
- **Choisir l'heure de remise et de retour** : « Pas de possibilité de choisir l’heure de début et fin de location. » (même avis). Absent de Zouti.
- **La caution gérée dans l'app** : « La prochaine amélioration pour moi désormais c’est la gestion sur l’application directement de la caution.. » ([App Store](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-13719039028)). Absent de Zouti.
- **Un délai minimum avant réservation** : « en tant que loueur j'ai bien préciser dans mes annonces de faire une réservation 4 jours avant encore dernièrement j'ai reçu une demande pour le jour même » ([Trustpilot](https://fr.trustpilot.com/reviews/694c379d8f7464cfd5219b71)). Absent de Zouti.
- **Des notifications de message** : « aucune notification lorsque l’on échange avec les utilisateurs » ([App Store](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-13481029390)). Zouti a des notifications dans l'app et par e-mail, mais pas encore de notifications push.
- Déjà dans Zouti : bloquer des dates d'indisponibilité ([avis](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-11751364105)) et choisir sa commune dans une liste ([avis](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6468510027/sortBy=mostRecent/json#review-12364058619)).

## 3. Ce que personne ne règle

- **La confiance entre inconnus quand le matériel revient abîmé.** Ni le chèque de caution ni la responsabilité civile ne suffisent, et la plateforme ne tranche pas (thème 9 ; 6 avis, 2 sources). En Guyane, sans recours facile à un loueur professionnel, c'est le vrai frein.
- **La fiabilité des loueurs.** Les locataires perdent un ou deux jours quand personne ne répond (thème 7 ; 7 avis, 2 sources). C'est fatal pour les besoins urgents : un cric, une pompe pendant une inondation, un groupe électrogène pendant une coupure.

## 4. Plan de correction pour Zouti

Classé selon la solidité des preuves et le coût de la correction.

| # | Correction | Taille | Skill | Preuves |
|---|---|---|---|---|
| 1 | **État des lieux en photos dans l'app** : photos datées prises par les deux parties à la remise et au retour, jointes à la réservation et au contrat | M | `/replica-build` | Litiges : 6 avis, 2 sources |
| 2 | **Relances et plan B quand le loueur ne répond pas** : rappel au loueur 12 h avant l'expiration, temps de réponse moyen affiché, annonces similaires proposées au locataire en cas de refus ou d'expiration | M | `/replica-build` | Sans réponse : 7 avis, 2 sources |
| 3 | **Règles d'annulation visibles avant d'envoyer la demande** (et rappelées sur la réservation) | S | `/replica-build` | Annulation : 11 avis, 2 sources |
| 4 | **Filtre par rayon (km)** autour de soi | S | `/replica-build` | 1 avis (mince) |
| 5 | **Heure de remise et de retour** sur la demande et le contrat | S | `/replica-build` | 1 avis (mince) |
| 6 | **Délai minimum de réservation** réglable par annonce (« au moins X jours avant ») | S | `/replica-build` | 1 avis (mince) |
| 7 | **Caution par empreinte bancaire** (paiement en ligne) | L | `/replica-backend` | 1 avis + thème litiges |
| 8 | **Notifications push** (avec l'app mobile) | M | `/replica-build` | 1 avis (mince) |

Les plaintes sur les prix et la commission vont à `/replica-launch`. Il faut garder la gratuité en main propre, et le jour où le paiement en ligne est activé, afficher les frais avant la demande.

## 5. L'angle de positionnement

**A (recommandé)**
> Pour les Guyanais qui ne veulent pas payer avant même de pouvoir poser une question, Zouti permet d'écrire gratuitement au propriétaire et ne prend aucune commission sur les locations réglées en main propre.
>
> Preuves : contact payant (8 avis, 2 sources), annulation (11 avis, 2 sources), frais (11 avis, 1 source).

**B**
> Pour ceux qui ont peur de récupérer leur matériel abîmé sans recours, Zouti fait un état des lieux en photos à la remise et au retour.
>
> Preuves : litiges (6 avis, 2 sources).

**C**
> Pour ceux qui ont perdu une journée à attendre un loueur, Zouti relance le propriétaire et propose une autre annonce dès qu'il ne répond pas.
>
> Preuves : sans réponse (7 avis, 2 sources).

Je recommande **A** comme message principal : Zouti le tient déjà aujourd'hui. B est la prochaine fonctionnalité à construire, celle qui donnera une raison durable de choisir Zouti.

Rappels du skill : ne jamais citer ces avis comme des témoignages sur le site de Zouti, ne jamais mettre le nom « Bricolib » dans le nom, les publicités ou la fiche App Store de Zouti, et confier toute page comparative à un avocat.

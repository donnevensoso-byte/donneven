# Marque : Zouti

Date : 2026-10-30. Angle retenu (`replica/fixes.md`, A) : *écrire gratuitement au propriétaire, aucune commission en main propre*.

## 1. Le nom

**Zouti** veut dire « outils » en créole guyanais et antillais. Le nom est court, se prononce comme il s'écrit, et ancre l'app en Guyane. Il ne ressemble à Bricolib ni par le son, ni par l'écriture, ni par le sens : pas de jeu sur « brico », pas de suffixe « -lib ».

Quatre noms de rechange, au cas où un contrôle juridique fermerait la porte :

| nom | style | idée |
| --- | --- | --- |
| Kaz'Outil | composé | « la case aux outils » du quartier |
| Prêtavoisin | descriptif | le voisin qui prête |
| Lokal | verbe et lieu | « louer local », se lit pareil en français et en créole |
| Kolok | inventé | « colloque » de voisins, court, libre de sens ailleurs |

### Contrôles effectués (dépistage, pas un avis juridique)

| contrôle | Zouti | date |
| --- | --- | --- |
| Marques France (INPI, data.inpi.fr, recherche « zouti ») | **Aucune marque « Zouti » en location, place de marché ou services en ligne.** À noter : « **Zouti Magic** », marque enregistrée **classe 9** (appareils, logiciels), déposée le 20/12/2025 par un particulier. « Zouti filé » (classe 25, sous-vêtements) et « Filé Zouti-la Tour » (classes 5, 25, 27, 32, 41) : autres secteurs. « ZOUTI » 2010 (classes 2, 20, 40) : expirée. | 2026-10-30 |
| Marques UE (EUIPO / TMview) | **à faire** (le site n'est pas lisible depuis mon environnement) ; l'INPI montre des marques UE en « Zoute » et « Zout » sans rapport | — |
| WIPO Global Brand Database | **à faire** | — |
| USPTO / Canada | sans objet pour un lancement en Guyane ; **à faire** avant toute sortie hors de France | — |
| Domaine zouti.fr | **pris**, et **à vendre** chez Dovendi (courtier), enregistré en 2023 | 2026-10-30 |
| Domaine zouti.com | **pris** (enregistré en 2010, certificat invalide) | 2026-10-30 |
| Domaine zouti.app | **pris** : « Zouti Technologies », logiciels Mac pour Apple Photos (« Kreyòl for tool ») | 2026-10-30 |
| Domaine **zouti97.fr** (retenu) | **libre** (RDAP AFNIC : introuvable) | 2026-10-31 |
| Domaine zouti973.fr | **libre** (RDAP AFNIC : introuvable) | 2026-10-30 |
| Domaine zouti-guyane.fr | **libre** (RDAP AFNIC : introuvable) | 2026-10-30 |
| Domaine zouti.gf | **à faire** chez un registrar .gf (pas de RDAP public) | — |
| App Store et Google Play | pas d'app « Zouti » trouvée par recherche web ; « **Zouti Photos** » (Mac) annoncée « bientôt » | 2026-10-30 |
| Comptes sociaux (Instagram, Facebook, TikTok, X) | **à faire** à la main : @zouti, @zouti973, @zoutiguyane | — |
| Le web (« Zouti location outils ») | rien dans le secteur, en Guyane ni aux Antilles | 2026-10-30 |

**Recommandation.**
1. Garder **Zouti** comme nom de service.
2. Déposer la marque à l'INPI en **classes 35** (mise en relation, place de marché), **39** (location de véhicules et de matériel de transport, pour les kayaks et remorques), **42** (plateforme en ligne) et **37** (location de matériel de chantier). Éviter la classe 9 seule, où « Zouti Magic » existe.
3. Sur les stores, publier sous un nom composé, par exemple « **Zouti – location d'outils Guyane** », pour ne pas se confondre avec Zouti Photos.
4. Domaine : **zouti97.fr**, choisi le 2026-10-31 et libre ce jour-là, à acheter chez IONOS. Il reste possible de faire une offre plus tard pour **zouti.fr**.
5. **Avant de dépenser pour la marque, faites valider par un conseil en propriété industrielle.** Ces contrôles ne sont qu'un premier tri.

## 2. Palette

La couleur principale reste le **vert forêt `#0b6e4f`**, une famille éloignée du jaune de Bricolib. Le secondaire était un jaune d'or `#f4c430`, trop proche des jaunes relevés sur bricolib.net (`#f1b60d`, `#ffbd01`) et utilisé lui aussi sur l'action « proposer » : il devient un **mangue corail `#ff8f5a`**.

| rôle | avant | après |
| --- | --- | --- |
| sun (bouton « Proposer un outil », bandeaux) | `#f4c430` | `#ff8f5a` |
| surface-sun (encarts, code de remise) | `#fdf3cf` | `#ffe9dc` |
| sun-text, warning | `#8a6500` | `#a3400c` |

Contraste : `contrast.py`, 21 paires, **0 échec AA**. Logo et icônes : le Z passe en blanc sur le vert et le point en mangue (il était rouge). Les couleurs de Bricolib sont dans `brand.json`, pour que la vérification les détecte.

## 3. Brief logo (pour la version définitive)

- **L'idée :** un Z qui est aussi un outil qui passe de main en main, le geste du prêt entre voisins.
- **Type :** symbole et logotype. Le symbole seul sert d'icône d'app et de favicon.
- **Contraintes :** lisible à 16 px (favicon) et à 1024 px (icône d'app). Deux couleurs maximum dans le symbole : vert `#0b6e4f` et blanc, avec le mangue en accent.
- **À livrer :** SVG du logo et du symbole ; icône d'app 1024 × 1024 sans transparence (iOS) ; jeu de favicons ; image de partage 1200 × 630.
- **Interdits :** rien qui rappelle la marque de Bricolib (pas de jaune d'or, pas de clé ou de marteau stylisé en monogramme « B »), ni le drapeau ou les armoiries officielles de la Guyane. On peut évoquer le vert et la forêt, pas copier un emblème public.
- **Aujourd'hui :** un symbole provisoire (Z blanc sur carré vert, point mangue) est en place dans `src/components/logo.tsx` et `public/icons/`.

## 4. Voix

**Trois mots**
- **Voisin**, pas familier : on se parle comme entre gens du quartier, avec le vouvoiement.
- **Clair**, pas sec : on dit ce qui se passe et ce qu'il faut faire, en une phrase.
- **Rassurant**, pas mielleux : on rappelle les règles (paiement, annulation, photos) au moment où elles comptent.

**À faire / à éviter**

| à faire | à éviter |
| --- | --- |
| « Le propriétaire a 48 h pour répondre. » | « Votre demande est en cours de traitement. » |
| « Annulation gratuite jusqu'au vendredi 6 novembre inclus. » | « Selon nos conditions générales d'annulation… » |
| « Débroussailleuse, karcher, groupe électrogène… » (le matériel d'ici) | des exemples de métropole qui ne parlent pas en Guyane |
| « Oups, un grain passe… » (une touche locale, rare) | du créole partout, ou des clins d'œil forcés |
| « Vous ne payez rien maintenant. » | « Aucun frais ne vous sera prélevé à ce stade de la procédure. » |

**Les 10 textes les plus vus, relus dans cette voix** (tous écrits pour Zouti ; seuls deux termes génériques, « Débroussailleuse » et « Laisser un avis », figurent aussi sur la page d'accueil de l'original)

| où | texte |
| --- | --- |
| Accueil, titre | Pourquoi acheter quand le voisin peut vous le louer ? |
| Accueil, recherche | Quel outil cherchez-vous ? |
| En-tête, recherche (lecteur d'écran) | Chercher du matériel près de chez vous *(réécrit : l'ancien « Rechercher un outil » était trop proche de l'original)* |
| En-tête, action principale | Proposer un outil |
| Inscription | Créer mon compte |
| Annonce, action principale | Demander à réserver |
| Annonce, sous le bouton | Vous ne payez rien maintenant. Le propriétaire a 48 h pour accepter. |
| Après la demande | Demande envoyée ! Marie a 48 h pour répondre. |
| Recherche vide | Aucune annonce ne correspond, avec en lien « Proposer ce matériel » |
| Erreur | Oups, un grain passe… Vérifiez votre connexion et réessayez. |

## 5. Vérification

`python3 .claude/skills/replica-brand/sweep.py . --config replica/brand.json` donne : **Clean**. L'analyse de départ (`docs/ANALYSE-BRICOLIB.md`) a rejoint les documents de travail, sous `replica/analyse-initiale.md`. Le README ne cite plus l'original.

J'ai aussi relu le favicon, les titres de page (« … – Zouti »), les e-mails (vert Zouti, signature Zouti) et le manifeste PWA. Il n'existe pas encore d'image de partage dédiée : elle est prévue dans le brief logo.

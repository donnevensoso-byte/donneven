# Page d'accueil : Zouti

Construite dans `src/app/page.tsx`. Captures : `replica/clone-screens/S01-accueil-390.png` et `S01-accueil-1440.png`. Contrôle axe : 0 violation à 390 et à 1440 px ; jetons de couleur : 0 échec AA (`contrast.py`).

Angle (`replica/fixes.md`, A) : *écrire gratuitement au propriétaire, aucune commission en main propre*.

| section | contenu | lien avec la preuve |
| --- | --- | --- |
| 1. Hero | « Louez le matériel de vos voisins, sans payer pour poser une question. » En dessous : « Écrivez gratuitement au propriétaire, réglez en main propre : zéro commission. » Une seule action, la recherche (« Trouver »). À droite, une **vraie capture** de l'app : réservation confirmée avec le code de remise. Compteur réel d'annonces en ligne, ou « Zouti démarre » s'il n'y en a aucune. | contact payant : 8 avis, 2 sources ; frais : 11 avis |
| 2. Le problème | « Payer avant même de pouvoir poser une question » ; « Annuler sans savoir ce qu'on récupère ». Reformulé, aucun avis cité. | thèmes 5, 3 et 2 de `feedback.md` |
| 3. Comment ça marche | 1. Posez votre question. 2. Demandez vos dates (48 h, plan B si c'est non). 3. Récupérez avec le code, photographiez, rendez. | boucle principale F01 |
| 4. Ce que Zouti fait autrement | question gratuite · 0 % en main propre · état des lieux en photos (fix 1) · un propriétaire qui répond (fix 2) · annulation claire (fix 3) · code de remise | les correctifs d'abord ; la parité vient ensuite |
| Catégories et dernières annonces | vraies données, liens vers les pages locales | — |
| 5. Prix | 0 € en main propre ; 10 % de frais de service par carte (réglable), sans frais fixes ; exemple chiffré à 25 € | `pricing.md` |
| 6. FAQ | casse (sans promettre d'assurance) · faut-il payer en ligne · propriétaire qui ne répond pas · hors de l'île de Cayenne et connexion lente · comment le propriétaire est payé | les vraies objections |
| 7. Appel final | « Votre matériel dort au fond du carbet ? », bouton « Proposer un outil gratuitement » | pour amorcer l'offre |

**Ce qui a été retiré, faute de preuve :** la mention « avis vérifiés » (remplacée par « photos datées à la remise et au retour ») et tout chiffre qui ne vient pas de la base. Pas de témoignage, pas de logo de presse, pas de note sur 5.

**À ne pas oublier au lancement :** ne jamais lancer `npm run db:seed` sur la base de production. Les annonces de démonstration deviendraient de fausses preuves (« 16 annonces en ligne »).

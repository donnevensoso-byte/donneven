# Plan de lancement : Zouti

Objectif des 60 premiers jours : **100 annonces actives et 20 locations terminées** sur l'île de Cayenne et à Kourou, avant d'ouvrir plus largement. Une place de marché locale vit ou meurt par l'offre : on commence par les propriétaires.

## Avant d'ouvrir (semaines 1 et 2)

- [ ] Déployer (`/replica-deploy`), avec la base de production **vide** (pas de données de démo).
- [ ] Brancher le SMTP réel (vérification d'adresse, demandes, rappels) et l'appel à `/api/cron` toutes les 15 minutes.
- [ ] Suivi d'erreurs (Sentry ou équivalent) et mesure d'audience respectueuse du RGPD (Plausible ou Umami, sans bandeau cookies), avec trois chiffres suivis : annonces publiées, demandes envoyées, locations terminées.
- [ ] Une liste d'attente simple : un formulaire sur la page d'accueil ou un Google Form relayé, « Prévenez-moi quand il y a du matériel dans ma commune ».
- [ ] Laisser le paiement par carte **désactivé** tant que la passe Stripe en mode test n'est pas faite. Le lancement se fait en main propre, conformément à l'angle.

## Les 10 premiers propriétaires, à la main

Personne ne viendra louer sur un site vide. Aller chercher dix propriétaires et les accompagner pour publier leur première annonce :

1. Le cercle proche : famille, collègues, voisins qui ont débroussailleuse, karcher, groupe électrogène ou barnum.
2. Les **groupes Facebook et WhatsApp de quartier et de commune** (Matoury, Rémire-Montjoly, Kourou, Macouria) : un message honnête, sans pub déguisée, qui explique la gratuité en main propre.
3. Les **associations** : jardins partagés, comités de quartier, associations de pêche et de kayak sur le fleuve.
4. Les **carbets et les fêtes** : barnums, tables, chaises et sonos se louent pour les baptêmes et les communions.
5. Une permanence d'une matinée sur un marché (Cayenne, Kourou), pour aider à photographier le matériel et publier sur place.

Pour chacun, noter ce qui a bloqué à la publication. Ce seront les prochaines corrections.

## Où parlent les utilisateurs mécontents de l'original

D'après la recherche (`replica/reviews.csv`), ils écrivent surtout sur **Trustpilot** et dans les **avis App Store**. Ce ne sont pas des lieux où démarcher : la loi et les conditions de ces plateformes l'interdisent. Leurs plaintes nourrissent en revanche nos messages : contact gratuit, aucune commission, annulation claire. **Ne jamais citer ces avis ni le nom de l'original** dans une publicité, sur le site ou sur les stores.

## Presse et communauté locales

- **France-Guyane, Guyane la 1ère, radios locales** : un angle « économie de partage et coût de la vie en Guyane », « louer au lieu d'acheter du matériel importé ».
- **Product Hunt ou Hacker News** : peu utiles pour un service local. On peut y publier un récit du produit, en tête « question gratuite, zéro commission, état des lieux en photos », mais sans en attendre d'utilisateurs guyanais.

## Les 10 premiers locataires

- Attendre que chaque commune ciblée ait au moins 10 annonces avant d'y faire de la publicité.
- Une campagne Facebook et Instagram très locale (rayon de 20 km, petit budget) autour des besoins de saison : débroussaillage en saison des pluies, groupes électrogènes pendant les coupures, barnums avant les fêtes.
- Appeler les dix premiers locataires après leur location : qu'est-ce qui a failli les faire renoncer ?

## Fiches des stores (plus tard)

La PWA s'installe déjà depuis le navigateur. Pour les stores :

- Fiche prête et vérifiée : `replica/launch/listing.json` (`listing.py`, 0 erreur).
- **À préparer :**
  - captures aux tailles exigées au moment de l'envoi (App Store Connect et Play Console les changent) ;
  - étiquettes de confidentialité et formulaire « sécurité des données » : e-mail, nom, téléphone facultatif, photos, messages ; aucune publicité ni revente ;
  - URL de confidentialité (`/confidentialite`) et de support (`mailto:` ou page contact) ;
  - classification d'âge 4+ ou 12+ selon la messagerie ;
  - notes pour la revue, avec un compte de démonstration **sur un environnement de démo séparé**.
- Garde-fou de la règle 4.1 (copies) : mettre dans les premières captures ce que Zouti fait autrement, à savoir la question gratuite, l'état des lieux en photos et le code de remise.

# Voix off : « Comment marche Zouti »

Vidéo : `zouti-comment-ca-marche.mp4`, 74 s. Chaque phrase doit tenir dans sa scène : la durée maximale est indiquée.

## Le texte, minuté

| scène | début | durée max | texte |
| --- | --- | --- | --- |
| Accroche | 0,3 s | 4 s | Besoin d'une débroussailleuse ce week-end ? Pas besoin de l'acheter. |
| Zouti | 4,9 s | 4 s | Avec Zouti, louez le matériel de vos voisins, partout en Guyane. |
| 1. Chercher | 9,5 s | 7,5 s | Un : cherchez près de chez vous. Tapez l'outil, choisissez votre commune : les annonces les plus proches s'affichent d'abord. |
| 2. Questions | 17,7 s | 7,5 s | Deux : posez vos questions au propriétaire avant de réserver. C'est gratuit, et sans carte bancaire. |
| 3. Dates | 25,9 s | 8 s | Trois : choisissez vos dates. Le prix total s'affiche avant d'envoyer, et le propriétaire a quarante-huit heures pour répondre. |
| 4. Acceptée | 34,7 s | 6,2 s | Quatre : il accepte ? Vous recevez votre code de remise. Et si c'est non, Zouti vous propose d'autres annonces libres. |
| 5. Remise | 41,5 s | 7,5 s | Cinq : le jour J, le propriétaire saisit votre code, et chacun photographie le matériel. Les photos sont datées. |
| 6. Retour | 49,7 s | 6,4 s | Six : au retour, vous réglez en main propre, sans commission. Puis chacun laisse un avis. |
| Récap | 56,7 s | 5,6 s | Question gratuite, zéro commission en main propre, état des lieux en photos. |
| Propriétaires | 62,9 s | 5 s | Votre matériel dort ? Publiez-le gratuitement : vous fixez le prix, et vous acceptez chaque demande. |
| Fin | 68,5 s | 5 s | Rendez-vous sur zouti quatre-vingt-dix-sept point f r. Le lien est en bio ! |

« zouti97.fr » est écrit en toutes lettres pour que la voix le prononce correctement.

## À coller dans ElevenLabs (un seul fichier)

Modèle « Eleven Multilingual v2 », une voix française, débit normal. Les balises `<break>` créent des silences : je m'en sers pour découper le fichier et caler chaque phrase sur sa scène.

```
Besoin d'une débroussailleuse ce week-end ? Pas besoin de l'acheter. <break time="1.5s" />
Avec Zouti, louez le matériel de vos voisins, partout en Guyane. <break time="1.5s" />
Un : cherchez près de chez vous. Tapez l'outil, choisissez votre commune : les annonces les plus proches s'affichent d'abord. <break time="1.5s" />
Deux : posez vos questions au propriétaire avant de réserver. C'est gratuit, et sans carte bancaire. <break time="1.5s" />
Trois : choisissez vos dates. Le prix total s'affiche avant d'envoyer, et le propriétaire a quarante-huit heures pour répondre. <break time="1.5s" />
Quatre : il accepte ? Vous recevez votre code de remise. Et si c'est non, Zouti vous propose d'autres annonces libres. <break time="1.5s" />
Cinq : le jour J, le propriétaire saisit votre code, et chacun photographie le matériel. Les photos sont datées. <break time="1.5s" />
Six : au retour, vous réglez en main propre, sans commission. Puis chacun laisse un avis. <break time="1.5s" />
Question gratuite, zéro commission en main propre, état des lieux en photos. <break time="1.5s" />
Votre matériel dort ? Publiez-le gratuitement : vous fixez le prix, et vous acceptez chaque demande. <break time="1.5s" />
Rendez-vous sur zouti quatre-vingt-dix-sept point f r. Le lien est en bio !
```

Une fois le MP3 téléchargé, il suffit de me l'envoyer : je découpe aux silences, je place chaque phrase au début de sa scène (en accélérant très légèrement une phrase trop longue, ou en allongeant la scène si besoin) et j'exporte la vidéo finale.

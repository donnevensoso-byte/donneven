# Journal de build — Zouti

Ordre suivi : `replica/architecture.md` (must-haves partiels, puis fix 1).
Captures : `replica/clone-screens/` (390 px et 1440 px, locataire et propriétaire).

| ID | date | état | ce qui manque | plus dur que prévu |
| --- | --- | --- | --- | --- |
| migration 0001/0002 | 2026-10-30 | fait | — | drizzle-kit pose des questions interactives sur un renommage de colonne (hors TTY) : snapshots corrigés à la main. Contraintes CHECK et anti-chevauchement (`btree_gist`) écrites en SQL manuel. |
| S08 code de remise | 2026-10-30 | fait | — | La remise passe maintenant obligatoirement par le code : le retour exige le statut « en cours », donc l'e2e a dû apprendre au propriétaire à saisir le code lu côté locataire. Limite 5 essais / 15 min. |
| S08 + contrat : état des lieux en photos (fix 1) | 2026-10-30 | fait | Pas de comparaison remise/retour côte à côte, pas de dossier de sinistre. | Fenêtres d'ajout par statut (remise : acceptée → en cours ; retour : en cours → 3 jours après). Photos stockées comme les images d'annonces. |
| S05/S08 paiement avec empreinte bancaire | 2026-10-30 | fait, **non vérifié avec Stripe réel** | Test avec de vraies clés Stripe (mode test) et le webhook réel ; versement au loueur toujours géré par Stripe Connect sans écran dédié. | Plus gros qu'il n'y paraissait : chaque sortie (refus, expiration 48 h, annulation, refus automatique d'une demande concurrente) doit libérer l'empreinte ; capture faite dans la transaction d'acceptation avec remboursement si la transaction échoue ; webhooks dédoublonnés (`stripe_events`). Le réseau du bac à sable bloque api.stripe.com : tout est testé avec une passerelle simulée (`tests/integration/payments.test.ts`). |
| S08/S10 versement à la remise | 2026-10-30 | fait, **non vérifié avec Stripe réel** | — | Passage des « destination charges » aux charges et virements séparés : sinon le loueur est payé dès l'acceptation, pas à la remise. Virement idempotent (clé `payout-{id}`), relancé par `/api/cron`. |
| S02 tri par réactivité | 2026-10-30 | fait | — | Paliers pour éviter qu'une réponse de plus bouleverse le classement. |
| S03 pages locales | 2026-10-30 | fait | — | noindex sur les pages vides, pour ne pas publier de pages creuses. |
| S08 litige | 2026-10-30 | fait | Pas d'outil de remboursement partiel côté admin. | L'équipe doit pouvoir lire le contrat sans être partie prenante : lecture admin du contrat seulement. |
| Fix 2 à 6 | 2026-10-30 | fait | Notifications push (fix 8). | Les rappels ont besoin d'une tâche planifiée : route `/api/cron` + secours au fil des visites. |

## Vérifications

- `tsc --noEmit` propre, `next build` propre.
- Vitest : 5 fichiers, 33 tests (dont 8 paiement) au vert.
- Playwright mobile : parcours complet (demande, acceptation, photos, code faux puis bon, retour, avis) au vert.
- Captures S08 sans erreur console.
- Parité : 67,9 → 73,9 → 80,6 ; must-haves 14 sur 14 (voir `replica/parity.md`).
- Après /replica-diff : 54 tests unitaires et d'intégration, 45 e2e au vert.

import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Questions fréquentes" };

const faq: { q: string; a: React.ReactNode }[] = [
  { q: "Zouti est-il gratuit ?", a: "Oui : l'inscription, la recherche et la publication d'annonces sont gratuites. Les locations réglées en main propre sont sans commission." },
  { q: "Dans quelles communes fonctionne Zouti ?", a: "Dans les 22 communes de Guyane, de Saint-Laurent-du-Maroni à Saint-Georges, en passant par l'île de Cayenne, Kourou et les communes du fleuve." },
  { q: "Comment les annonces sont-elles classées ?", a: "Par défaut, les annonces des propriétaires qui répondent à leurs demandes (acceptées ou refusées) passent devant celles des propriétaires qui les laissent expirer. On regarde les 10 dernières demandes ; un nouveau membre part avec un bon niveau. Vous pouvez aussi trier par date, prix ou distance." },
  { q: "Comment se passe le paiement ?", a: "Par défaut, le locataire règle la location au propriétaire lors de la remise du matériel (espèces, virement, Wero…). Si le paiement en ligne est activé pour une annonce, le locataire pose une empreinte bancaire avec sa demande : il n'est débité que si le propriétaire accepte, et le propriétaire reçoit la location dès la remise du matériel (code du locataire)." },
  { q: "À quoi sert la caution ?", a: "Elle protège le propriétaire en cas de casse ou de perte. Elle est remise en main propre (chèque non encaissé ou espèces) et rendue au retour si le matériel est en bon état. Indiquez tout défaut dans l'état des lieux du contrat." },
  { q: "Que se passe-t-il si le matériel est abîmé ?", a: <>Constatez les dégâts ensemble au retour et notez-les sur le contrat. Le locataire est responsable du matériel pendant la location : la caution peut couvrir la réparation. Pensez à vérifier votre assurance habitation (responsabilité civile). En cas de litige, écrivez-nous à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</> },
  { q: "Combien de temps le propriétaire a-t-il pour répondre ?", a: "48 heures (ou jusqu'au jour de début si la location commence plus tôt). Sans réponse, la demande expire automatiquement." },
  { q: "Puis-je annuler ?", a: "Le locataire peut annuler gratuitement jusqu'à la veille du début de la location. Le propriétaire peut annuler une réservation tant que le matériel n'a pas été remis. Prévenez toujours l'autre personne par message." },
  { q: "Quand vois-je le numéro de téléphone ?", a: "Les coordonnées (téléphone, WhatsApp) sont partagées uniquement une fois la réservation confirmée. Avant, échangez via la messagerie Zouti." },
  { q: "Quel prix fixer pour mon matériel ?", a: "Un prix journalier autour de 5 à 10 % du prix neuf est attractif. Proposez un prix à la semaine pour les longues durées, et une caution proche de la valeur de revente." },
  { q: "Dois-je déclarer mes revenus de location ?", a: <>Les revenus tirés de la location de biens sont en principe imposables. Les plateformes doivent transmettre à l&apos;administration fiscale les revenus des utilisateurs qui dépassent certains seuils. Consultez la rubrique « économie collaborative » de <a href="https://www.impots.gouv.fr" target="_blank" rel="noreferrer">impots.gouv.fr</a> et <a href="https://www.urssaf.fr" target="_blank" rel="noreferrer">urssaf.fr</a>.</> },
  { q: "Quel matériel est interdit ?", a: "Armes, produits dangereux ou réglementés, matériel volé ou contrefait, véhicules à moteur nécessitant une assurance spécifique (voitures, scooters) et tout ce qui est illégal. Les annonces non conformes sont retirées." },
  { q: "Comment supprimer mon compte ?", a: <>Depuis <Link href="/compte">Mon compte</Link>, en bas de page. Vos données sont alors effacées, sauf obligation légale de conservation.</> },
];

export default function FaqPage() {
  return (
    <ContentPage title="Questions fréquentes">
      <div className="space-y-2">
        {faq.map((item) => (
          <details key={item.q} className="card group p-4">
            <summary className="cursor-pointer list-none font-semibold after:float-right after:text-muted after:content-['+'] group-open:after:content-['−']">
              {item.q}
            </summary>
            <div className="mt-2 text-sm leading-relaxed text-ink/90">{item.a}</div>
          </details>
        ))}
      </div>
      <p className="mt-8">
        Une autre question ? Écrivez-nous à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </ContentPage>
  );
}

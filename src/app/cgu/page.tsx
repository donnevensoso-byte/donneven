import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ToFill } from "@/components/content-page";
import { CONTACT_EMAIL, REQUEST_TTL_HOURS } from "@/lib/config";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function TermsPage() {
  return (
    <ContentPage title="Conditions générales d'utilisation" updated="28 octobre 2026">
      <p>
        Les présentes conditions encadrent l&apos;utilisation du service Zouti (le « Service »), édité par <ToFill>raison sociale de l&apos;éditeur</ToFill>{" "}
        (voir les <Link href="/mentions-legales">mentions légales</Link>). En créant un compte, vous les acceptez.
      </p>

      <h2>1. Objet du Service</h2>
      <p>
        Zouti est une plateforme de mise en relation entre particuliers résidant en Guyane, permettant à des membres (« Propriétaires ») de
        proposer à la location du matériel leur appartenant, et à d&apos;autres membres (« Locataires ») de le louer. Zouti n&apos;est ni propriétaire,
        ni loueur, ni dépositaire du matériel : le contrat de location est conclu directement entre le Propriétaire et le Locataire.
      </p>

      <h2>2. Inscription</h2>
      <ul>
        <li>L&apos;inscription est gratuite et réservée aux personnes physiques majeures agissant à titre non professionnel.</li>
        <li>Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel.</li>
        <li>Un seul compte par personne. Zouti peut suspendre un compte en cas de manquement aux présentes conditions.</li>
      </ul>

      <h2>3. Annonces</h2>
      <ul>
        <li>Le Propriétaire garantit être propriétaire du matériel proposé, qu&apos;il est en bon état de fonctionnement, conforme aux normes de sécurité et décrit fidèlement (photos réelles, état, accessoires).</li>
        <li>Sont interdits : armes et munitions, produits dangereux ou réglementés, matériel volé ou contrefait, véhicules terrestres à moteur soumis à obligation d&apos;assurance, et tout bien dont la location est illicite.</li>
        <li>
          Classement des annonces : par défaut, les annonces sont affichées de la plus récente à la plus ancienne. L&apos;utilisateur peut les trier
          par prix ou par distance. Aucun Propriétaire ne paie pour améliorer son classement.
        </li>
      </ul>

      <h2>4. Réservation</h2>
      <ul>
        <li>Le Locataire envoie une demande pour des dates données ; le prix total est affiché avant l&apos;envoi.</li>
        <li>Le Propriétaire dispose de {REQUEST_TTL_HOURS} heures pour accepter ou refuser ; sans réponse, la demande expire.</li>
        <li>L&apos;acceptation forme le contrat de location entre les membres. Un modèle de contrat avec état des lieux est mis à disposition.</li>
        <li>Le Locataire peut annuler sans frais jusqu&apos;à la veille du début de la location. Le Propriétaire peut annuler tant que le matériel n&apos;a pas été remis.</li>
      </ul>

      <h2>5. Prix, paiement et caution</h2>
      <ul>
        <li>Le Propriétaire fixe librement le prix et le montant de la caution.</li>
        <li>Paiement en main propre : la location et la caution sont réglées directement entre les membres lors de la remise ; Zouti ne perçoit aucune somme ni commission.</li>
        <li>Paiement en ligne (lorsqu&apos;il est proposé) : le Locataire paie par carte via le prestataire de paiement Stripe ; des frais de service, affichés avant la demande, rémunèrent Zouti. Le montant de la location est reversé au Propriétaire. En cas d&apos;annulation conforme à l&apos;article 4, le paiement est intégralement remboursé.</li>
      </ul>

      <h2>6. Responsabilités</h2>
      <ul>
        <li>Le Locataire utilise le matériel conformément à sa destination et aux consignes reçues, avec les équipements de protection adaptés, et le restitue en bon état. Il est responsable de sa perte, de son vol ou de sa détérioration pendant la location.</li>
        <li>Le Propriétaire est responsable de la conformité et de la sécurité du matériel remis.</li>
        <li>Zouti, simple intermédiaire, n&apos;est pas partie au contrat de location et ne garantit ni le matériel, ni la solvabilité ou le comportement des membres. Zouti met en œuvre des moyens raisonnables pour assurer la disponibilité du Service.</li>
        <li>Les membres sont invités à vérifier leur couverture d&apos;assurance (responsabilité civile, biens loués).</li>
      </ul>

      <h2>7. Avis</h2>
      <p>
        Après chaque location terminée, chaque membre peut publier un avis sur l&apos;autre dans un délai de 30 jours. Seuls les membres ayant
        effectivement réalisé la location peuvent laisser un avis. Les avis ne sont pas rémunérés ; ils sont publiés sans modération préalable et
        affichés du plus récent au plus ancien. Un avis illicite ou diffamatoire peut être signalé et retiré.
      </p>

      <h2>8. Modération et signalements</h2>
      <p>
        Tout contenu ou comportement illicite ou contraire aux présentes conditions peut être signalé via le bouton « Signaler » ou à{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Zouti peut retirer une annonce, masquer un contenu ou suspendre un compte ; le membre
        concerné en est informé avec les motifs de la décision et peut la contester à la même adresse.
      </p>

      <h2>9. Obligations fiscales et sociales</h2>
      <p>
        Les revenus tirés de la location de biens sur Zouti peuvent être imposables et, au-delà de certains seuils, soumis à cotisations
        sociales. Il appartient à chaque Propriétaire de déclarer ses revenus. Conformément à l&apos;article 242 bis du code général des impôts,
        Zouti informe ses membres de leurs obligations et transmet, le cas échéant, à l&apos;administration fiscale les informations requises les
        concernant. Plus d&apos;informations sur <a href="https://www.impots.gouv.fr" target="_blank" rel="noreferrer">impots.gouv.fr</a> et{" "}
        <a href="https://www.urssaf.fr" target="_blank" rel="noreferrer">urssaf.fr</a>.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans notre <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>11. Durée, résiliation et modification</h2>
      <p>
        Vous pouvez supprimer votre compte à tout moment depuis « Mon compte ». Zouti peut modifier les présentes conditions ; les membres
        sont informés de toute modification substantielle avant son entrée en vigueur.
      </p>

      <h2>12. Droit applicable et litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige avec Zouti, contactez-nous d&apos;abord à{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Le consommateur peut recourir gratuitement au médiateur de la consommation{" "}
        <ToFill>nom et coordonnées du médiateur</ToFill>. Les litiges entre membres relèvent de leur seule relation contractuelle.
      </p>
    </ContentPage>
  );
}

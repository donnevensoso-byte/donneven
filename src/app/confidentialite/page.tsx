import type { Metadata } from "next";
import { ContentPage, ToFill } from "@/components/content-page";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <ContentPage title="Politique de confidentialité" updated="28 octobre 2026">
      <p>
        Le responsable du traitement est <ToFill>raison sociale, adresse</ToFill>. Pour toute question ou pour exercer vos droits :{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li><strong>Compte</strong> : nom, adresse e-mail, mot de passe (stocké chiffré), commune, et si vous les ajoutez : téléphone, photo, présentation.</li>
        <li><strong>Annonces</strong> : descriptions, photos, prix, zone approximative de retrait.</li>
        <li><strong>Activité</strong> : réservations, messages échangés, avis, favoris, signalements.</li>
        <li><strong>Paiement en ligne</strong> (le cas échéant) : traité par Stripe ; Zouti ne voit jamais vos numéros de carte.</li>
        <li><strong>Technique</strong> : un cookie de session strictement nécessaire à la connexion. Aucun cookie publicitaire ni de mesure d&apos;audience tierce.</li>
      </ul>

      <h2>Finalités et bases légales</h2>
      <ul>
        <li>Fournir le Service (compte, annonces, réservations, messagerie, avis) : exécution du contrat.</li>
        <li>Sécurité, prévention de la fraude, modération : intérêt légitime.</li>
        <li>Obligations fiscales et comptables (dont l&apos;article 242 bis du CGI) : obligation légale.</li>
      </ul>

      <h2>Destinataires</h2>
      <p>
        Les autres membres voient votre profil public (prénom, initiale du nom, commune, photo, présentation, avis). Votre téléphone et votre nom
        complet ne sont communiqués qu&apos;à l&apos;autre partie d&apos;une réservation confirmée. Nos sous-traitants : hébergement{" "}
        <ToFill>hébergeur et localisation des serveurs</ToFill>, envoi d&apos;e-mails <ToFill>prestataire e-mail</ToFill>, paiement Stripe. Vos
        données ne sont jamais vendues.
      </p>

      <h2>Durées de conservation</h2>
      <ul>
        <li>Données de compte : jusqu&apos;à la suppression du compte.</li>
        <li>Messages et réservations : 3 ans après la fin de la location (preuve en cas de litige).</li>
        <li>Données de transaction : 10 ans (obligations comptables).</li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité. Vous pouvez
        modifier votre profil et supprimer votre compte depuis « Mon compte », ou nous écrire. Vous pouvez introduire une réclamation auprès de la
        CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>).
      </p>
    </ContentPage>
  );
}

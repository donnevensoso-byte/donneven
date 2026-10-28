import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Confiance et sécurité" };

export default function TrustPage() {
  return (
    <ContentPage title="Confiance et sécurité" intro="Quelques règles simples pour que chaque location se passe bien.">
      <h2>Avant la location</h2>
      <ul>
        <li>Consultez le profil, les avis et le taux de réponse de l&apos;autre membre.</li>
        <li>Échangez via la messagerie Zouti : elle garde une trace de ce qui a été convenu.</li>
        <li>Méfiez-vous des demandes de paiement à l&apos;avance, des liens de paiement reçus par SMS ou des « transporteurs » inconnus.</li>
      </ul>
      <h2>Le jour de la remise</h2>
      <ul>
        <li>Retrouvez-vous dans un lieu sûr et en journée. Vérifiez la pièce d&apos;identité du locataire.</li>
        <li>Imprimez ou complétez ensemble le <strong>contrat de location</strong> disponible sur chaque réservation confirmée.</li>
        <li>Faites un état des lieux avec photos datées (carrosserie, lames, niveau de carburant, accessoires).</li>
        <li>Le propriétaire explique le fonctionnement et les consignes de sécurité. Le locataire teste le matériel sur place.</li>
        <li>La caution est remise en main propre : chèque non encaissé ou espèces contre reçu.</li>
      </ul>
      <h2>Pendant et après</h2>
      <ul>
        <li>Utilisez les équipements de protection adaptés (lunettes, gants, casque, chaussures, protections auditives), indispensables pour une débroussailleuse ou une tronçonneuse.</li>
        <li>En cas de panne, prévenez immédiatement le propriétaire et ne réparez rien sans son accord.</li>
        <li>Rendez le matériel propre, à l&apos;heure, avec le plein si c&apos;était convenu.</li>
        <li>Au retour, vérifiez l&apos;état ensemble, rendez la caution, puis laissez-vous un avis honnête.</li>
      </ul>
      <h2>Assurance</h2>
      <p>
        Les locations entre particuliers ne sont pas automatiquement assurées. Vérifiez auprès de votre assureur ce que couvre votre
        contrat habitation (responsabilité civile du locataire, biens prêtés ou loués). La caution reste la première garantie du propriétaire.
      </p>
      <h2>Un problème ?</h2>
      <p>
        Utilisez le bouton « Signaler » sur une annonce ou un profil. Notre équipe examine chaque signalement et peut retirer des annonces ou
        suspendre des comptes.
      </p>
    </ContentPage>
  );
}

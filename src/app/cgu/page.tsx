import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales" };

export default function TermsPage() {
  return (
    <div className="container-app max-w-3xl space-y-6 py-10 text-slate-700">
      <h1 className="heading text-4xl">Conditions générales d&apos;utilisation</h1>
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        ⚠️ Modèle de démonstration. Ces conditions doivent être relues et complétées par un avocat avant la mise en production
        (statut d&apos;intermédiaire, contrat d&apos;assurance flotte, conformité RGPD, TVA applicable dans les DROM et collectivités d&apos;outre-mer).
      </p>
      <section>
        <h2 className="heading text-2xl">1. Objet</h2>
        <p>Woulé est une plateforme de mise en relation entre particuliers propriétaires de véhicules et locataires, en Guadeloupe, Martinique, Guyane, Saint-Martin et Saint-Barthélemy. Woulé n&apos;est pas loueur : le contrat de location est conclu directement entre le propriétaire et le locataire.</p>
      </section>
      <section>
        <h2 className="heading text-2xl">2. Inscription</h2>
        <p>L&apos;inscription est réservée aux personnes majeures. Pour louer, le conducteur doit avoir au moins 21 ans et fournir un permis de conduire valide. Les informations fournies doivent être exactes et à jour.</p>
      </section>
      <section>
        <h2 className="heading text-2xl">3. Obligations du propriétaire</h2>
        <p>Le propriétaire garantit que le véhicule est assuré, à jour de son contrôle technique, en bon état de fonctionnement et conforme à l&apos;annonce. Il s&apos;engage à respecter les réservations acceptées.</p>
      </section>
      <section>
        <h2 className="heading text-2xl">4. Obligations du locataire</h2>
        <p>Le locataire utilise le véhicule en bon père de famille, sur le territoire de location uniquement, respecte le code de la route, les restrictions de l&apos;annonce (ferry, pistes) et les consignes préfectorales en cas d&apos;alerte cyclonique. Il restitue le véhicule à l&apos;heure, avec le même niveau de carburant.</p>
      </section>
      <section>
        <h2 className="heading text-2xl">5. Paiement, caution et annulation</h2>
        <p>Le paiement est encaissé par Woulé pour le compte du propriétaire. Une empreinte bancaire du montant de la caution est réalisée au départ. Les conditions d&apos;annulation et la Garantie Cyclone sont détaillées dans la rubrique Aide.</p>
      </section>
      <section id="confidentialite">
        <h2 className="heading text-2xl">6. Données personnelles</h2>
        <p>Les données collectées (identité, permis, coordonnées) servent uniquement à la gestion des locations et à la prévention de la fraude. Les coordonnées ne sont partagées avec l&apos;autre partie qu&apos;après confirmation de la réservation. Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression.</p>
      </section>
      <section id="mentions">
        <h2 className="heading text-2xl">7. Mentions légales</h2>
        <p>Éditeur : [Raison sociale], [forme juridique] au capital de [montant], RCS [ville] [numéro], siège social [adresse]. Directeur de la publication : [nom]. Hébergeur : [nom et adresse de l&apos;hébergeur].</p>
      </section>
    </div>
  );
}

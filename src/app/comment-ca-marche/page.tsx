import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Comment ça marche" };

const renter = [
  ["Cherchez", "Tapez l'outil dont vous avez besoin et choisissez votre commune. Filtrez par dates, prix ou livraison."],
  ["Demandez", "Choisissez vos dates : le prix total s'affiche. Envoyez votre demande avec un petit mot. Vous ne payez rien à ce stade."],
  ["Organisez", "Le propriétaire accepte sous 48 h. Ses coordonnées s'affichent : convenez du lieu et de l'heure par message ou WhatsApp."],
  ["Récupérez", "Vérifiez le matériel ensemble, remplissez le contrat, réglez la location et laissez la caution."],
  ["Rendez", "Rapportez le matériel propre à la date prévue, récupérez votre caution et laissez un avis."],
];
const owner = [
  ["Publiez gratuitement", "Quelques photos, un prix par jour, une caution : votre annonce est en ligne en 3 minutes."],
  ["Choisissez vos locataires", "Vous recevez les demandes par e-mail et notification. Consultez le profil et les avis, puis acceptez ou refusez."],
  ["Remettez le matériel", "Expliquez son fonctionnement, encaissez la location et la caution, puis confirmez la remise dans l'application."],
  ["Récupérez et notez", "Vérifiez l'état au retour, rendez la caution, confirmez le retour et laissez un avis au locataire."],
];

export default function HowItWorksPage() {
  return (
    <ContentPage title="Comment ça marche" intro="Zouti met en relation les Guyanais qui ont du matériel et ceux qui en ont besoin. Simple, local et sans abonnement.">
      <h2>Vous voulez louer du matériel</h2>
      <ol className="mb-6 space-y-3">
        {renter.map(([title, text], i) => (
          <li key={title} className="card flex gap-4 p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
            <div>
              <h3 className="!mt-0">{title}</h3>
              <p className="!mb-0 text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2>Vous voulez proposer votre matériel</h2>
      <ol className="mb-6 space-y-3">
        {owner.map(([title, text], i) => (
          <li key={title} className="card flex gap-4 p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sun-400 font-bold">{i + 1}</span>
            <div>
              <h3 className="!mt-0">{title}</h3>
              <p className="!mb-0 text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2>Combien ça coûte ?</h2>
      <p>
        L&apos;inscription et la publication d&apos;annonces sont gratuites. Pour les locations réglées en main propre, Zouti ne prend aucune
        commission. Si le paiement en ligne est proposé sur une annonce, des frais de service sont affichés avant toute demande.
      </p>
      <p className="mt-6 flex flex-wrap gap-3">
        <Link href="/recherche" className="btn-primary !text-white !no-underline">Trouver du matériel</Link>
        <Link href="/annonces/nouvelle" className="btn-sun !text-ink !no-underline">Proposer un outil</Link>
      </p>
    </ContentPage>
  );
}

import type { Metadata } from "next";
import { FEES, INSURANCE_PLANS, type InsurancePlan } from "@/lib/constants";
import { euros } from "@/lib/format";

export const metadata: Metadata = { title: "Aide & FAQ" };

const SECTIONS: { id: string; title: string; items: [string, React.ReactNode][] }[] = [
  {
    id: "louer",
    title: "Louer un véhicule",
    items: [
      ["Qui peut louer ?", `Toute personne de ${FEES.minAge} ans ou plus, titulaire d'un permis B valide. Un supplément jeune conducteur de ${euros(FEES.youngDriverPerDay)} / jour s'applique si votre permis a moins de ${FEES.youngDriverYears} ans.`],
      ["Mon permis étranger est-il accepté ?", "Les permis de l'Union européenne sont acceptés tels quels. Pour les autres pays (Haïti, Dominique, Sainte-Lucie, Brésil, Suriname…), présentez un permis international en complément."],
      ["Réservation instantanée ou demande ?", `Avec la réservation instantanée, la location est acceptée tout de suite et vous payez immédiatement. Sinon, le propriétaire a ${FEES.requestExpiryHours} h pour accepter votre demande ; vous ne payez qu'après son accord.`],
      ["Comment se passe la remise des clés ?", "Chez le propriétaire, ou livré à l'aéroport / au port si l'option est proposée. Faites l'état des lieux ensemble dans l'application : kilométrage, carburant et photos des 4 côtés."],
      ["Quels frais sont inclus ?", `Le prix affiché comprend la location, l'assurance choisie et des frais de service de ${FEES.serviceFeePct} %. La caution n'est pas débitée : c'est une simple empreinte bancaire.`],
    ],
  },
  {
    id: "assurance",
    title: "Assurance",
    items: (Object.keys(INSURANCE_PLANS) as InsurancePlan[]).map((p) => [
      `Formule ${INSURANCE_PLANS[p].label} — à partir de ${euros(INSURANCE_PLANS[p].perDay)} / jour`,
      `${INSURANCE_PLANS[p].description} Franchise : ${INSURANCE_PLANS[p].deductiblePct} % du montant de la caution.`,
    ]),
  },
  {
    id: "cyclone",
    title: "Garantie Cyclone & météo",
    items: [
      ["Qu'est-ce que la Garantie Cyclone ?", "Si Météo-France déclenche une vigilance rouge, violette ou grise sur votre territoire, vous pouvez annuler votre location et être remboursé à 100 %, frais de service compris, même au dernier moment."],
      ["Et si l'alerte tombe pendant ma location ?", "Mettez-vous à l'abri et suivez les consignes de la préfecture. Ne prenez pas la route en vigilance violette (confinement). Contactez le propriétaire via la messagerie pour convenir d'un retour anticipé ; les jours non utilisés sont remboursés avec la formule Sérénité."],
      ["Les dégâts liés au cyclone sont-ils couverts ?", "Uniquement avec la formule Sérénité, et à condition d'avoir respecté les consignes de sécurité (véhicule stationné à l'abri, pas de circulation en vigilance violette)."],
      ["Les nouvelles réservations sont-elles possibles ?", "Pendant une vigilance rouge, violette ou grise, aucune location ne peut démarrer dans les 72 h suivantes."],
    ],
  },
  {
    id: "annulation",
    title: "Annulation",
    items: [
      ["Je suis locataire", "Plus de 48 h avant le départ : remboursement intégral hors frais de service. Moins de 48 h : remboursement de 50 % hors frais de service. Garantie Cyclone : 100 %."],
      ["Je suis propriétaire", "Si vous annulez, le locataire est remboursé intégralement. Les annulations répétées font baisser la visibilité de vos annonces."],
    ],
  },
  {
    id: "territoires",
    title: "Spécificités des territoires",
    items: [
      ["Puis-je prendre le ferry avec la voiture (Marie-Galante, Les Saintes, La Désirade) ?", "Seulement si le propriétaire l'autorise : filtrez les annonces « Autorisé sur ferry ». Le billet véhicule reste à votre charge."],
      ["Guyane : puis-je rouler sur les pistes ?", "Seulement avec les véhicules marqués « Pistes autorisées », généralement des 4x4. Les communes de l'intérieur (Maripasoula, Saül, Camopi…) ne sont pas reliées par la route."],
      ["Saint-Martin : puis-je aller côté hollandais ?", "Oui, la circulation est libre sur toute l'île. La livraison à l'aéroport Princess Juliana dépend du propriétaire."],
      ["Quelle heure fait foi ?", "Les horaires de location sont toujours exprimés dans l'heure locale du territoire du véhicule (UTC-4 aux Antilles, UTC-3 en Guyane)."],
    ],
  },
  {
    id: "proprietaires",
    title: "Propriétaires",
    items: [
      ["Combien coûte Woulé ?", `L'inscription et la publication sont gratuites. Woulé prélève une commission de ${FEES.ownerCommissionPct} % sur chaque location, qui couvre l'assurance, l'assistance et le paiement sécurisé.`],
      ["Quand suis-je payé ?", "Par virement sur votre IBAN, 3 jours ouvrés après la fin de chaque location."],
      ["Et en cas de dommage ?", "Signalez-le dans l'état des lieux de retour avec des photos. Notre équipe gère le dossier avec l'assureur et la caution du locataire."],
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="container-app max-w-3xl py-10">
      <h1 className="heading text-4xl">Aide & FAQ</h1>
      <nav className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="chip hover:bg-lagon-100">{s.title}</a>)}
      </nav>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
          <h2 className="heading text-2xl">{s.title}</h2>
          <div className="mt-4 space-y-2">
            {s.items.map(([q, a]) => (
              <details key={q} className="card group p-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-4">{q}<span className="text-lagon-600 transition group-open:rotate-45">+</span></span>
                </summary>
                <p className="mt-2 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <section className="card mt-12 p-6 text-center">
        <h2 className="font-semibold">Besoin d&apos;aide pendant une location ?</h2>
        <p className="mt-1 text-slate-600">Assistance 24 h/24, 7 j/7 : <strong>0590 00 00 00</strong> (Guadeloupe, Saint-Martin, Saint-Barth) · <strong>0596 00 00 00</strong> (Martinique) · <strong>0594 00 00 00</strong> (Guyane)</p>
        <p className="mt-1 text-xs text-slate-400">Numéros fictifs de démonstration.</p>
      </section>
    </div>
  );
}

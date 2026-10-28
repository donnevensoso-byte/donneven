import type { Metadata } from "next";
import Link from "next/link";
import { RevenueSimulator } from "@/components/RevenueSimulator";
import { Icon, type IconName } from "@/components/Icon";
import { FEES } from "@/lib/constants";

export const metadata: Metadata = { title: "Mettre ma voiture en location" };

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "shield", title: "Assuré à chaque location", text: "Une assurance tous risques couvre votre véhicule pendant chaque location, avec assistance 24 h/24 sur tout le territoire." },
  { icon: "calendar", title: "Vous gardez la main", text: "Vos prix, vos dates, vos règles. Bloquez votre calendrier pendant le carnaval ou les vacances en un clic." },
  { icon: "plane", title: "Visez les touristes", text: "Proposez la livraison à l'aéroport ou au port : c'est l'option la plus demandée par les visiteurs et la diaspora." },
  { icon: "check", title: "Locataires vérifiés", text: `Permis contrôlé, âge minimum de ${FEES.minAge} ans, avis de la communauté et caution bloquée sur la carte bancaire.` },
];

export default function BecomeOwnerPage() {
  return (
    <div className="container-app py-10">
      <section className="max-w-3xl">
        <h1 className="heading text-4xl md:text-5xl">Votre voiture peut travailler pour vous 🌴</h1>
        <p className="mt-4 text-lg text-slate-600">
          Aux Antilles et en Guyane, une voiture passe en moyenne 95 % de son temps garée. Louez-la aux visiteurs et aux voisins
          quand vous ne l&apos;utilisez pas, et couvrez votre crédit, votre assurance ou vos vacances.
        </p>
      </section>
      <section className="mt-8">
        <RevenueSimulator />
      </section>
      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {POINTS.map((p) => (
          <div key={p.title} className="card flex gap-4 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lagon-100 text-lagon-700"><Icon name={p.icon} /></span>
            <div>
              <h2 className="font-semibold">{p.title}</h2>
              <p className="mt-1 text-slate-600">{p.text}</p>
            </div>
          </div>
        ))}
      </section>
      <div className="mt-10 text-center">
        <Link href="/proprietaire/vehicules/nouveau" className="btn-accent px-8 py-3 text-base">Créer mon annonce gratuitement</Link>
        <p className="mt-2 text-sm text-slate-500">Aucun abonnement. Woulé ne prend une commission que lorsque vous louez.</p>
      </div>
    </div>
  );
}

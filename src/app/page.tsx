import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { vehicleRatings } from "@/lib/queries";
import { TERRITORIES } from "@/lib/territories";
import { SearchForm } from "@/components/SearchForm";
import { VehicleCard } from "@/components/VehicleCard";
import { Icon, type IconName } from "@/components/Icon";

export const dynamic = "force-dynamic";

const TERRITORY_GRADIENTS: Record<string, string> = {
  guadeloupe: "from-lagon-500 to-lagon-800",
  martinique: "from-flamboyant-400 to-flamboyant-700",
  guyane: "from-emerald-500 to-emerald-800",
  "saint-martin": "from-sky-400 to-sky-700",
  "saint-barthelemy": "from-amber-400 to-orange-600",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const [featured, counts] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      include: { photos: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.vehicle.groupBy({ by: ["territory"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const ratings = await vehicleRatings(featured.map((v) => v.id));
  const favorites = user
    ? new Set((await prisma.favorite.findMany({ where: { userId: user.id }, select: { vehicleId: true } })).map((f) => f.vehicleId))
    : new Set<string>();
  const countBy = new Map(counts.map((c) => [c.territory, c._count._all]));

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-lagon-100 via-sable-50 to-sable-50">
        <Waves />
        <div className="container-app relative pb-14 pt-10 md:pb-20 md:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-lagon-800 shadow-sm">
            🌴 Guadeloupe · Martinique · Guyane · Saint-Martin · Saint-Barth
          </p>
          <h1 className="heading max-w-3xl text-4xl leading-tight md:text-6xl">
            Louez la voiture d&apos;un voisin, <span className="text-flamboyant-500">woulé</span> où vous voulez.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Des centaines de véhicules de particuliers, livrés à l&apos;aéroport ou au port, assurés et à prix locaux.
            Moins cher qu&apos;une agence, plus simple qu&apos;un taxi.
          </p>
          <div className="mt-8">
            <SearchForm />
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-1.5"><Icon name="shield" className="h-4 w-4 text-lagon-600" /> Assurance incluse</li>
            <li className="flex items-center gap-1.5"><Icon name="plane" className="h-4 w-4 text-lagon-600" /> Livraison aéroport & port</li>
            <li className="flex items-center gap-1.5"><Icon name="storm" className="h-4 w-4 text-lagon-600" /> Garantie Cyclone</li>
            <li className="flex items-center gap-1.5"><Icon name="snow" className="h-4 w-4 text-lagon-600" /> Véhicules climatisés</li>
          </ul>
        </div>
      </section>

      <section className="container-app py-12">
        <h2 className="heading text-2xl md:text-3xl">Où allez-vous ?</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {TERRITORIES.map((t) => (
            <Link
              key={t.id}
              href={`/recherche?territoire=${t.id}`}
              className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${TERRITORY_GRADIENTS[t.id]}`}
            >
              <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur">{t.code}</span>
              <span className="font-display text-xl font-semibold leading-tight">{t.name}</span>
              <span className="text-sm text-white/85">{countBy.get(t.id) ?? 0} véhicule(s)</span>
              <span className="mt-2 line-clamp-2 text-xs text-white/75">{t.tagline}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-app py-6">
          <div className="flex items-end justify-between">
            <h2 className="heading text-2xl md:text-3xl">Les dernières pépites</h2>
            <Link href="/recherche" className="text-sm font-semibold text-lagon-700 hover:underline">Tout voir →</Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((v) => (
              <VehicleCard key={v.id} v={{ ...v, rating: ratings.get(v.id) ?? { avg: 0, count: 0 } }} favorite={favorites.has(v.id)} loggedIn={Boolean(user)} />
            ))}
          </div>
        </section>
      )}

      <section className="container-app py-14">
        <h2 className="heading text-center text-2xl md:text-3xl">Comment ça marche ?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Step n={1} icon="search" title="Trouvez" text="Choisissez votre territoire, vos dates, et comparez les véhicules autour de vous ou livrés à l'aéroport." />
          <Step n={2} icon="key" title="Réservez" text="Réservation instantanée ou en un message au propriétaire. Paiement sécurisé, assurance incluse." />
          <Step n={3} icon="car" title="Woulé !" text="Faites l'état des lieux depuis l'app en photo, récupérez les clés et profitez de l'île." />
        </div>
      </section>

      <section className="container-app">
        <div className="grid gap-5 md:grid-cols-2">
          <div id="cyclone" className="card overflow-hidden bg-gradient-to-br from-encre to-lagon-900 p-8 text-white">
            <Icon name="storm" className="h-10 w-10 text-amber-300" />
            <h3 className="heading mt-4 text-2xl text-white">Garantie Cyclone</h3>
            <p className="mt-2 text-slate-200">
              Vigilance rouge ou violette déclarée par Météo-France sur votre territoire ? Annulez votre location
              et soyez remboursé à 100 %, même au dernier moment. Pendant la saison cyclonique (juin à novembre), louez l&apos;esprit tranquille.
            </p>
            <Link href="/aide#cyclone" className="mt-5 inline-block font-semibold text-amber-300 hover:underline">En savoir plus →</Link>
          </div>
          <div className="card overflow-hidden bg-flamboyant-50 p-8">
            <Icon name="key" className="h-10 w-10 text-flamboyant-500" />
            <h3 className="heading mt-4 text-2xl">Votre voiture dort au garage ?</h3>
            <p className="mt-2 text-slate-600">
              Rentabilisez-la quand vous ne vous en servez pas : touristes, familles en vacances, proches de la diaspora de passage…
              Vous fixez vos prix et vos disponibilités, Woulé s&apos;occupe de l&apos;assurance et du paiement.
            </p>
            <Link href="/louer-ma-voiture" className="btn-accent mt-5">Estimer mes revenus</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon, title, text }: { n: number; icon: IconName; title: string; text: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lagon-100 text-lagon-700">
          <Icon name={icon} />
        </span>
        <span className="text-sm font-semibold text-slate-400">Étape {n}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-slate-600">{text}</p>
    </div>
  );
}

function Waves() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-lagon-200/50" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
      <path fill="currentColor" d="M0 96c120-32 240-48 360-32s240 64 360 64 240-48 360-64 240 0 360 32v64H0z" />
    </svg>
  );
}

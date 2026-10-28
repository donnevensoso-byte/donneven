import Link from "next/link";
import { CommuneOptions } from "@/components/commune-select";
import { ListingGrid } from "@/components/listing-card";
import { EmptyState } from "@/components/ui";
import { CATEGORIES } from "@/lib/guyane";
import { countActiveListings, searchListings } from "@/lib/services/listings";

export const dynamic = "force-dynamic";

const steps = [
  { icon: "🔍", title: "Trouvez près de chez vous", text: "Cherchez par commune, de Cayenne à Maripasoula, et comparez les prix à la journée." },
  { icon: "📅", title: "Réservez en quelques clics", text: "Choisissez vos dates, envoyez une demande : le propriétaire répond sous 48 h." },
  { icon: "🤝", title: "Récupérez et rendez", text: "Convenez du rendez-vous par message, réglez sur place, puis laissez-vous un avis." },
];

export default async function HomePage() {
  const [{ items: latest }, total] = await Promise.all([searchListings({ pageSize: 8 }), countActiveListings()]);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-700 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #f4c430 0, transparent 35%), radial-gradient(circle at 85% 80%, #12875f 0, transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-20">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-sun-300 uppercase">
            Location entre particuliers · Guyane
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-extrabold sm:text-5xl">
            Pourquoi acheter quand le voisin peut vous le louer&nbsp;?
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Débroussailleuse, karcher, groupe électrogène, barnum, kayak… Louez le matériel des Guyanais près de chez vous, ou
            rentabilisez le vôtre.
          </p>
          <form action="/recherche" className="mt-8 grid max-w-3xl gap-2 rounded-2xl bg-white p-2 text-ink shadow-xl sm:grid-cols-[1fr_220px_auto]" role="search">
            <label className="sr-only" htmlFor="hero-q">Quel outil cherchez-vous ?</label>
            <input id="hero-q" name="q" type="search" placeholder="Quel outil cherchez-vous ?" className="input border-0 bg-sand" />
            <label className="sr-only" htmlFor="hero-commune">Commune</label>
            <select id="hero-commune" name="commune" className="input border-0 bg-sand" defaultValue="">
              <option value="">Toute la Guyane</option>
              <CommuneOptions />
            </select>
            <button type="submit" className="btn-sun py-3">Rechercher</button>
          </form>
          <p className="mt-4 text-sm text-white/70">
            {total > 0 ? `${total} annonce${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""} en Guyane` : "Soyez parmi les premiers à proposer votre matériel !"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-bold sm:text-2xl">Parcourir par catégorie</h2>
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.filter((c) => c.slug !== "autre").map((c) => (
            <li key={c.slug}>
              <Link
                href={`/recherche?categorie=${c.slug}`}
                className="card flex h-full flex-col items-center gap-1.5 px-2 py-4 text-center text-xs font-medium hover:border-brand-200 hover:bg-brand-50 sm:text-sm"
              >
                <span className="text-2xl" aria-hidden>{c.icon}</span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Dernières annonces</h2>
          <Link href="/recherche" className="text-sm font-semibold text-brand-600 hover:underline">Tout voir →</Link>
        </div>
        {latest.length > 0 ? (
          <ListingGrid listings={latest} />
        ) : (
          <EmptyState icon="🧰" title="Aucune annonce pour l'instant" action={{ href: "/annonces/nouvelle", label: "Publier la première annonce" }}>
            Zouti démarre : proposez votre matériel et lancez l&apos;entraide dans votre quartier.
          </EmptyState>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold sm:text-2xl">Comment ça marche</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <span className="text-3xl" aria-hidden>{s.icon}</span>
              <h3 className="mt-3 font-semibold">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-sun-400 p-6 sm:grid-cols-[1.4fr_1fr] sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Votre matériel dort au fond du carbet&nbsp;?</h2>
            <p className="mt-3 max-w-lg text-ink/80">
              Une débroussailleuse louée 25 € trois week-ends par mois, c&apos;est 75 € pour vous. Publier une annonce est gratuit et
              vous gardez la main : vous acceptez qui vous voulez, quand vous voulez.
            </p>
            <Link href="/annonces/nouvelle" className="btn mt-5 bg-ink text-white hover:bg-ink/85">Proposer un outil gratuitement</Link>
          </div>
          <ul className="space-y-3 text-sm font-medium">
            <li className="rounded-2xl bg-white/70 p-4">✅ Annonce gratuite, sans engagement</li>
            <li className="rounded-2xl bg-white/70 p-4">🛡️ Caution et avis vérifiés pour louer sereinement</li>
            <li className="rounded-2xl bg-white/70 p-4">📄 Contrat de location prêt à imprimer</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <h3 className="font-semibold">💸 Économique</h3>
            <p className="mt-1 text-sm text-muted">Le matériel coûte cher en Guyane. Louer pour un week-end revient souvent 10 fois moins cher qu&apos;acheter.</p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">🌳 Écologique</h3>
            <p className="mt-1 text-sm text-muted">Moins d&apos;objets importés par conteneur, moins de déchets : on partage ce qui existe déjà.</p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">🤝 Solidaire</h3>
            <p className="mt-1 text-sm text-muted">Le koudmen version 2.0 : on s&apos;entraide entre voisins, dans tout le territoire.</p>
          </div>
        </div>
      </section>
    </>
  );
}

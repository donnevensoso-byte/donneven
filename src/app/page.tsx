import Image from "next/image";
import Link from "next/link";
import { CommuneOptions } from "@/components/commune-select";
import { ListingGrid } from "@/components/listing-card";
import { EmptyState } from "@/components/ui";
import { serviceFeePercent, stripeEnabled } from "@/lib/config";
import { CATEGORIES } from "@/lib/guyane";
import { countActiveListings, searchListings } from "@/lib/services/listings";

export const dynamic = "force-dynamic";

// Page construite sur l'angle retenu (replica/launch/landing.md) : question gratuite,
// aucune commission en main propre. Pas de faux chiffres ni de faux témoignages.

const problems = [
  {
    title: "Payer avant même de pouvoir poser une question",
    text: "Sur beaucoup de plateformes, il faut sortir sa carte pour demander si la débroussailleuse a son harnais. Et sur une location à 10 €, les frais peuvent dépasser 4 €.",
  },
  {
    title: "Annuler sans savoir ce qu'on récupère",
    text: "Des règles d'annulation enfouies dans l'aide, des remboursements qui traînent : on finit par ne plus oser réserver.",
  },
];

const steps = [
  { icon: "💬", title: "Posez votre question", text: "Écrivez au propriétaire gratuitement, sans carte bancaire : état, accessoires, lieu de retrait." },
  { icon: "📅", title: "Demandez vos dates", text: "Il a 48 h pour répondre. S'il refuse ou ne répond pas, Zouti vous montre d'autres annonces libres." },
  { icon: "🤝", title: "Récupérez, photographiez, rendez", text: "Le jour J, vous donnez votre code de remise, vous prenez l'état des lieux en photos, puis vous rendez le matériel." },
];

const features = [
  { icon: "💬", title: "Question gratuite", text: "La messagerie est ouverte avant toute demande. Personne ne paie pour parler." },
  { icon: "0 %", title: "Aucune commission en main propre", text: "Vous réglez le propriétaire sur place, en espèces, par virement ou Wero. Zouti ne prend rien." },
  { icon: "📸", title: "État des lieux en photos", text: "Photos datées des deux côtés, à la remise et au retour, reprises dans le contrat. En cas de désaccord, elles font foi." },
  { icon: "⏰", title: "Un propriétaire qui répond", text: "Rappel au propriétaire avant l'expiration, délai de réponse affiché, et un plan B si c'est non." },
  { icon: "📆", title: "Annulation claire", text: "Gratuite jusqu'à la veille, avec la date exacte affichée avant que vous envoyiez la demande." },
  { icon: "🔢", title: "Code de remise", text: "Le propriétaire saisit votre code quand il vous confie le matériel : la location démarre à ce moment-là, pas avant." },
];

const faq = [
  {
    q: "Et si le matériel revient abîmé ?",
    a: "Vous faites l'état des lieux en photos ensemble à la remise et au retour, la caution est convenue à l'avance, et le contrat est prêt à imprimer. Si vous ne vous entendez pas, signalez le problème depuis la réservation : l'équipe Zouti s'appuie sur les photos, le contrat et la conversation. Zouti n'est pas une assurance : vérifiez aussi votre responsabilité civile.",
  },
  {
    q: "Dois-je payer en ligne ?",
    a: "Non. Par défaut, tout se règle en main propre, sans frais. Quand un propriétaire active le paiement par carte, vous posez une empreinte bancaire avec la demande et vous n'êtes débité que s'il accepte.",
  },
  {
    q: "Que se passe-t-il si le propriétaire ne répond pas ?",
    a: "Il est relancé avant l'expiration de la demande (48 h). Si elle expire ou s'il refuse, vous voyez tout de suite les annonces libres aux mêmes dates, les plus proches d'abord.",
  },
  {
    q: "Ça marche hors de l'île de Cayenne ?",
    a: "Oui : les 22 communes sont couvertes, de Saint-Laurent à Saint-Georges, de Kourou à Maripasoula. Le site est léger, s'installe sur le téléphone comme une appli et tient sur une connexion lente.",
  },
  {
    q: "Comment je reçois l'argent quand je loue ?",
    a: "En main propre, directement de la main du locataire. En paiement par carte, la location est virée sur votre compte bancaire dès que vous confirmez la remise avec le code du locataire.",
  },
];

export default async function HomePage() {
  const [{ items: latest }, total] = await Promise.all([searchListings({ pageSize: 8 }), countActiveListings()]);
  const fee = serviceFeePercent();

  return (
    <>
      <section className="relative overflow-hidden bg-brand-700 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, var(--color-sun) 0, transparent 35%), radial-gradient(circle at 85% 80%, var(--color-brand-500) 0, transparent 45%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
              Location entre voisins · Guyane
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-extrabold sm:text-5xl">
              Louez le matériel de vos voisins, sans payer pour poser une question.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
              Débroussailleuse, karcher, groupe électrogène, kayak… Écrivez gratuitement au propriétaire, réglez en main propre :
              zéro commission.
            </p>
            <form action="/recherche" className="mt-8 grid max-w-2xl gap-2 rounded-2xl bg-white p-2 text-ink shadow-xl sm:grid-cols-[1fr_200px_auto]" role="search">
              <label className="sr-only" htmlFor="hero-q">Quel outil cherchez-vous ?</label>
              <input id="hero-q" name="q" type="search" placeholder="Quel outil cherchez-vous ?" className="input border-0 bg-sand" />
              <label className="sr-only" htmlFor="hero-commune">Commune</label>
              <select id="hero-commune" name="commune" className="input border-0 bg-sand" defaultValue="">
                <option value="">Toute la Guyane</option>
                <CommuneOptions />
              </select>
              <button type="submit" className="btn-sun py-3">Trouver</button>
            </form>
            <p className="mt-4 text-sm text-white/80">
              {total > 0 ? `${total} annonce${total > 1 ? "s" : ""} en ligne en Guyane` : "Zouti démarre : soyez parmi les premiers à proposer votre matériel."}
            </p>
          </div>
          <div className="mx-auto hidden w-64 overflow-hidden rounded-[2rem] border-8 border-ink/80 bg-white shadow-2xl lg:block">
            <Image
              src="/landing/reservation-mobile.webp"
              alt="Une réservation sur Zouti : statut confirmé, code de remise à 4 chiffres à montrer au propriétaire"
              width={390}
              height={820}
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="probleme">
        <h2 id="probleme" className="text-xl font-bold sm:text-2xl">Louer entre particuliers, ça devrait être simple</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {problems.map((p) => (
            <div key={p.title} className="card p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4" aria-labelledby="comment">
        <h2 id="comment" className="text-xl font-bold sm:text-2xl">Comment ça marche</h2>
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

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="atouts">
        <h2 id="atouts" className="text-xl font-bold sm:text-2xl">Ce que Zouti fait autrement</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="card p-5">
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-brand-50 px-2 text-lg font-bold text-brand-700" aria-hidden>
                {f.icon}
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <h2 className="text-xl font-bold sm:text-2xl">Parcourir par catégorie</h2>
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.filter((c) => c.slug !== "autre").map((c) => (
            <li key={c.slug}>
              <Link
                href={`/location-outils/${c.slug}`}
                className="card flex h-full flex-col items-center gap-1.5 px-2 py-4 text-center text-xs font-medium hover:border-brand-200 hover:bg-brand-50 sm:text-sm"
              >
                <span className="text-2xl" aria-hidden>{c.icon}</span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Dernières annonces</h2>
          <Link href="/recherche" className="text-sm font-semibold text-brand-600 underline hover:no-underline">Tout voir</Link>
        </div>
        {latest.length > 0 ? (
          <ListingGrid listings={latest} />
        ) : (
          <EmptyState icon="🧰" title="Aucune annonce pour l'instant" action={{ href: "/annonces/nouvelle", label: "Publier la première annonce" }}>
            Zouti démarre : proposez votre matériel et lancez l&apos;entraide dans votre quartier.
          </EmptyState>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="tarifs-titre" id="tarifs">
        <h2 id="tarifs-titre" className="text-xl font-bold sm:text-2xl">Combien ça coûte</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <h3 className="font-semibold">Pour louer ou proposer</h3>
            <p className="mt-2 text-3xl font-extrabold">0 €</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>✓ Annonces gratuites, sans limite</li>
              <li>✓ Messagerie gratuite avant toute demande</li>
              <li>✓ Règlement en main propre : aucune commission</li>
              <li>✓ Contrat et état des lieux en photos inclus</li>
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Paiement par carte (au choix du propriétaire)</h3>
            <p className="mt-2 text-3xl font-extrabold">{fee} %</p>
            <p className="text-sm text-muted">de frais de service, payés par le locataire, sans frais fixes</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>✓ Débit seulement si le propriétaire accepte</li>
              <li>✓ Remboursement intégral si l&apos;annulation est faite à temps</li>
              <li>✓ Virement au propriétaire dès la remise, sans frais de retrait</li>
            </ul>
            {!stripeEnabled() && <p className="mt-3 text-xs text-muted">Bientôt disponible : aujourd&apos;hui, tout se règle en main propre.</p>}
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Exemple : débroussailleuse à 25 € le week-end</h3>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">En main propre</dt>
                <dd className="font-semibold">25,00 €</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Par carte</dt>
                <dd className="font-semibold">{(25 * (1 + fee / 100)).toFixed(2).replace(".", ",")} €</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Reçu par le propriétaire</dt>
                <dd className="font-semibold">25,00 €</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12" aria-labelledby="questions">
        <h2 id="questions" className="text-xl font-bold sm:text-2xl">Vos questions</h2>
        <div className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
          {faq.map((item) => (
            <details key={item.q} className="group p-4">
              <summary className="cursor-pointer font-semibold">{item.q}</summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-sm">
          <Link href="/faq" className="text-brand-600 underline hover:no-underline">Toutes les questions</Link>
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-sun-400 p-6 sm:grid-cols-[1.4fr_1fr] sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Votre matériel dort au fond du carbet&nbsp;?</h2>
            <p className="mt-3 max-w-lg text-ink">
              Une débroussailleuse louée 25 € trois week-ends par mois, c&apos;est 75 € pour vous, sans commission. Vous acceptez
              qui vous voulez, quand vous voulez.
            </p>
            <Link href="/annonces/nouvelle" className="btn mt-5 bg-ink text-white hover:bg-ink/85">Proposer un outil gratuitement</Link>
          </div>
          <ul className="space-y-3 text-sm font-medium">
            <li className="rounded-2xl bg-white/80 p-4">✅ Annonce gratuite, sans engagement</li>
            <li className="rounded-2xl bg-white/80 p-4">📸 Photos datées à la remise et au retour</li>
            <li className="rounded-2xl bg-white/80 p-4">📄 Contrat de location prêt à imprimer</li>
          </ul>
        </div>
      </section>
    </>
  );
}

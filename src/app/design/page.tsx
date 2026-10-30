import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ListingCard } from "@/components/listing-card";
import { Alert, Avatar, Badge, EmptyState, Stars } from "@/components/ui";

// Vitrine du design system (/replica-design) : chaque composant isolé, dans ses états.
export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const ROLES = [
  "bg", "surface", "surface-accent", "surface-sun", "border", "border-input", "text", "text-muted",
  "accent", "accent-strong", "on-accent", "sun", "sun-text", "danger", "success", "warning",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold">Design system Zouti</h1>
        <p className="mt-1 text-muted">Source : replica/design/tokens.json → src/app/tokens.css. Contraste vérifié : 21 paires, 0 échec AA.</p>
      </div>

      <Section title="Rôles de couleur">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => (
            <li key={role} className="flex items-center gap-3 text-sm">
              <span className="size-10 shrink-0 rounded-lg border border-line" style={{ background: `var(--color-${role})` }} />
              <code>{role}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typographie">
        <p className="text-5xl font-extrabold tracking-tight">Display 48</p>
        <p className="text-3xl font-extrabold">Titre 30</p>
        <p className="text-2xl font-bold">Titre 24</p>
        <p className="text-xl font-bold">Titre 20</p>
        <p className="text-lg font-semibold">Sous-titre 18</p>
        <p className="text-base">Texte 16 : louez la débroussailleuse du voisin.</p>
        <p className="text-sm">Texte 14 : utilisé dans les cartes et formulaires.</p>
        <p className="text-xs font-medium text-muted">Légende 12 : aide sous un champ.</p>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary">Principal</button>
          <button type="button" className="btn-secondary">Secondaire</button>
          <button type="button" className="btn-sun">Proposer un outil</button>
          <button type="button" className="btn-danger">Supprimer</button>
          <button type="button" className="btn-ghost">Discret</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary py-3 text-base">Grand (48 px)</button>
          <button type="button" className="btn-primary" disabled>Désactivé</button>
          <button type="button" className="btn-primary" disabled aria-busy>Envoi…</button>
        </div>
      </Section>

      <Section title="Champs">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="d-1">Repos</label>
            <input className="input" id="d-1" placeholder="Ex. Débroussailleuse" />
            <p className="hint">Aide sous le champ.</p>
          </div>
          <div>
            <label className="label" htmlFor="d-2">Erreur</label>
            <input className="input" id="d-2" defaultValue="Abc" aria-invalid aria-describedby="d-2-error" />
            <p className="field-error" id="d-2-error">Le titre doit faire au moins 5 caractères</p>
          </div>
          <div>
            <label className="label" htmlFor="d-3">Désactivé</label>
            <input className="input" id="d-3" defaultValue="Cayenne" disabled />
          </div>
          <div>
            <label className="label" htmlFor="d-4">Liste</label>
            <select className="input" id="d-4" defaultValue="jardin">
              <option value="jardin">🌿 Jardin & débroussaillage</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="d-5">Date</label>
            <input className="input" id="d-5" type="date" />
          </div>
          <div>
            <label className="label" htmlFor="d-6">Texte long</label>
            <textarea className="input min-h-20" id="d-6" placeholder="Votre message…" />
          </div>
        </div>
      </Section>

      <Section title="Badges et alertes">
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">Confirmée</Badge>
          <Badge tone="yellow">En attente de réponse</Badge>
          <Badge tone="red">Masquée</Badge>
          <Badge>Neutre</Badge>
        </div>
        <div className="space-y-2">
          <Alert tone="info">Information.</Alert>
          <Alert tone="success">Votre annonce est en ligne.</Alert>
          <Alert tone="warning">Confirmez votre adresse e-mail pour publier.</Alert>
          <Alert tone="error">E-mail ou mot de passe incorrect.</Alert>
        </div>
      </Section>

      <Section title="Avatars et notes">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Marie-Laure Désiré" size={32} />
          <Avatar name="Kévin Ho" size={48} />
          <Avatar name="Sandra Pinas" size={64} />
          <Stars value={4.8} count={12} size="md" />
          <Stars value={null} count={0} size="md" />
        </div>
      </Section>

      <Section title="Carte d'annonce (sans photo)">
        <div className="grid max-w-md grid-cols-2 gap-4">
          <ListingCard
            listing={{
              id: "demo", title: "Débroussailleuse thermique Stihl FS 131", category: "jardin", dayPrice: 2500, weekPrice: 12000,
              deposit: 20000, commune: "matoury", neighborhood: "Balata", lat: 4.85, lng: -52.33, delivery: true, status: "active",
              createdAt: new Date(), coverImageId: null, rating: 4.9, reviewCount: 7, ownerName: "Marie-Laure Désiré", distanceKm: 6,
            }}
          />
          <ListingCard
            listing={{
              id: "demo2", title: "Kayak biplace", category: "fleuve", dayPrice: 3000, weekPrice: null, deposit: 0, commune: "saint-laurent-du-maroni",
              neighborhood: null, lat: 5.5, lng: -54, delivery: false, status: "active", createdAt: new Date(), coverImageId: null,
              rating: null, reviewCount: 0, ownerName: "Sandra Pinas",
            }}
          />
        </div>
      </Section>

      <Section title="Étapes et récapitulatif de prix">
        <ol className="grid grid-cols-4 gap-1 text-center text-xs font-medium" aria-label="Étapes">
          {["Demande", "Confirmée", "Remise", "Rendue"].map((label, i) => (
            <li key={label}>
              <div className={`h-1.5 rounded-full ${i <= 1 ? "bg-brand-600" : "bg-line"}`} />
              <span className={`mt-1 block ${i <= 1 ? "text-brand-700" : "text-muted"}`}>{label}</span>
            </li>
          ))}
        </ol>
        <dl className="max-w-sm space-y-1.5 rounded-xl bg-sand p-3 text-sm">
          <div className="flex justify-between"><dt>25 € × 3 jours</dt><dd>75 €</dd></div>
          <div className="flex justify-between border-t border-line pt-1.5 font-semibold"><dt>Total à régler sur place</dt><dd>75 €</dd></div>
          <div className="flex justify-between text-muted"><dt>Caution (rendue au retour)</dt><dd>200 €</dd></div>
        </dl>
      </Section>

      <Section title="Messages">
        <div className="max-w-md space-y-2 rounded-xl bg-sand p-3">
          <p className="mx-auto max-w-md rounded-xl bg-sun-100 px-3 py-2 text-center text-xs">✅ Réservation confirmée !</p>
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-2 text-[15px]">Bonjour ! Toujours disponible samedi ?</div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-[15px] text-white">Oui, à partir de 9 h.</div>
          </div>
        </div>
      </Section>

      <EmptyState icon="🧰" title="État vide" action={{ href: "/recherche", label: "Action principale" }}>
        Une phrase qui explique quoi faire ensuite.
      </EmptyState>
    </div>
  );
}

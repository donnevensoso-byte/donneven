import Link from "next/link";
import { TERRITORIES } from "@/lib/territories";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 bg-encre pb-24 pt-12 text-slate-300 md:pb-12">
      <div className="container-app grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo light />
          <p className="text-sm">
            La location de véhicules entre particuliers, pensée pour la Guadeloupe, la Martinique, la Guyane, Saint-Martin et Saint-Barthélemy.
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Territoires</h3>
          <ul className="space-y-2 text-sm">
            {TERRITORIES.map((t) => (
              <li key={t.id}>
                <Link href={`/recherche?territoire=${t.id}`} className="hover:text-white">
                  Location de voiture en {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Woulé</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/louer-ma-voiture" className="hover:text-white">Devenir propriétaire</Link></li>
            <li><Link href="/aide" className="hover:text-white">Aide & FAQ</Link></li>
            <li><Link href="/aide#cyclone" className="hover:text-white">Garantie Cyclone</Link></li>
            <li><Link href="/aide#assurance" className="hover:text-white">Assurance</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Légal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/cgu" className="hover:text-white">Conditions générales</Link></li>
            <li><Link href="/cgu#confidentialite" className="hover:text-white">Confidentialité</Link></li>
            <li><Link href="/cgu#mentions" className="hover:text-white">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
      <p className="container-app mt-10 text-xs text-slate-500">© {new Date().getFullYear()} Woulé — Fait avec ❤️ aux Antilles-Guyane.</p>
    </footer>
  );
}

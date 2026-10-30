import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/config";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white pb-24 md:pb-0 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">
            La location d&apos;outils entre voisins, de Saint-Laurent à Saint-Georges. Fait en Guyane 🇬🇫
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Découvrir</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/comment-ca-marche" className="hover:text-ink">Comment ça marche</Link></li>
            <li><Link href="/recherche" className="hover:text-ink">Toutes les annonces</Link></li>
            <li><Link href="/location-outils" className="hover:text-ink">Par commune</Link></li>
            <li><Link href="/annonces/nouvelle" className="hover:text-ink">Proposer un outil</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Aide</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/faq" className="hover:text-ink">Questions fréquentes</Link></li>
            <li><Link href="/confiance" className="hover:text-ink">Confiance & sécurité</Link></li>
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">Nous contacter</a></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Légal</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/cgu" className="hover:text-ink">Conditions d&apos;utilisation</Link></li>
            <li><Link href="/confidentialite" className="hover:text-ink">Confidentialité</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-ink">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

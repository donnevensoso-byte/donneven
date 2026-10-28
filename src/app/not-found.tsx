import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>🔦</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n&apos;existe pas ou l&apos;annonce a été retirée.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn-secondary">Accueil</Link>
        <Link href="/recherche" className="btn-primary">Voir les annonces</Link>
      </div>
    </div>
  );
}

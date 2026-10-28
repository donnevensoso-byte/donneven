import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-app py-20 text-center">
      <p className="text-6xl">🛺</p>
      <h1 className="heading mt-4 text-3xl">Page introuvable</h1>
      <p className="mt-2 text-slate-600">Cette route ne mène nulle part… même en 4x4.</p>
      <Link href="/" className="btn-primary mt-6">Retour à l&apos;accueil</Link>
    </div>
  );
}

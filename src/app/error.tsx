"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>🌧️</p>
      <h1 className="mt-4 text-2xl font-bold">Oups, un grain passe…</h1>
      <p className="mt-2 text-muted">Une erreur s&apos;est produite. Vérifiez votre connexion et réessayez.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Réessayer</button>
    </div>
  );
}

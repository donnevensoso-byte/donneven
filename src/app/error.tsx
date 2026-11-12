"use client";

import { CloudRain } from "lucide-react";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-50 text-brand-700" aria-hidden>
        <CloudRain className="size-10" />
      </span>
      <h1 className="mt-4 text-2xl font-bold">Oups, un grain passe…</h1>
      <p className="mt-2 text-muted">Une erreur s&apos;est produite. Vérifiez votre connexion et réessayez.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Réessayer</button>
    </div>
  );
}

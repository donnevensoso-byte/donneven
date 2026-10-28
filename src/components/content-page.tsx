import type { ReactNode } from "react";

export function ContentPage({ title, intro, updated, children }: { title: string; intro?: ReactNode; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
      {updated && <p className="mt-2 text-xs text-muted">Dernière mise à jour : {updated}</p>}
      <div className="prose-zouti mt-6">{children}</div>
    </article>
  );
}

/** Information à renseigner par l'éditeur avant la mise en ligne. */
export function ToFill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-sun-100 px-1 font-medium">[{children}]</mark>;
}

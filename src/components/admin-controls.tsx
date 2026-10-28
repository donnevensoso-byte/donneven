"use client";

import { useState, useTransition } from "react";
import { banUserAction, hideListingAction, resolveReportAction } from "@/app/actions/admin";
import type { ActionState } from "@/lib/errors";

function AdminButton({ label, action, danger, confirmText }: { label: string; action: () => Promise<ActionState>; danger?: boolean; confirmText?: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={`${danger ? "btn-danger" : "btn-secondary"} px-3 py-1.5 text-xs`}
        disabled={pending}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          startTransition(async () => setState(await action()));
        }}
      >
        {label}
      </button>
      {state && <span className="text-xs text-muted">{state.error ?? state.message}</span>}
    </span>
  );
}

export function ResolveReport({ id }: { id: string }) {
  return <AdminButton label="Marquer traité" action={() => resolveReportAction(id)} />;
}

export function HideListing({ id, hidden }: { id: string; hidden: boolean }) {
  return hidden ? (
    <AdminButton label="Rétablir l'annonce" action={() => hideListingAction(id, false)} />
  ) : (
    <AdminButton label="Masquer l'annonce" danger action={() => hideListingAction(id, true)} />
  );
}

export function BanUser({ id, banned }: { id: string; banned: boolean }) {
  return banned ? (
    <AdminButton label="Lever la suspension" action={() => banUserAction(id, false)} />
  ) : (
    <AdminButton label="Suspendre" danger confirmText="Suspendre ce membre ? Ses annonces seront masquées." action={() => banUserAction(id, true)} />
  );
}

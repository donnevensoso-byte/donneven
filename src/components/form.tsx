"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/errors";
import { Alert } from "./ui";

const PendingContext = createContext(false);

type Action = (prev: ActionState | undefined, formData: FormData) => Promise<ActionState>;

/**
 * Envoie le formulaire à une server action sans le réinitialiser : en cas
 * d'erreur, l'utilisateur garde sa saisie (y compris les photos choisies).
 */
export function useActionForm(action: Action) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };
  return { state, pending, onSubmit };
}

export function ActionForm({
  form,
  children,
  ...props
}: { form: ReturnType<typeof useActionForm>; children: ReactNode } & Omit<ComponentProps<"form">, "onSubmit" | "action">) {
  return (
    <PendingContext.Provider value={form.pending}>
      <form {...props} onSubmit={form.onSubmit} noValidate>
        {children}
      </form>
    </PendingContext.Provider>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn-primary",
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const contextPending = useContext(PendingContext);
  const { pending: statusPending } = useFormStatus();
  const pending = contextPending || statusPending;
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending ? (pendingLabel ?? "Envoi…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState | undefined }) {
  if (!state) return null;
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.message) return <Alert tone="success">{state.message}</Alert>;
  if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
    return <Alert tone="error">Certains champs sont à corriger.</Alert>;
  }
  return null;
}

export function FieldError({ state, name }: { state: ActionState | undefined; name: string }) {
  const message = state?.fieldErrors?.[name];
  if (!message) return null;
  return (
    <p className="field-error" id={`${name}-error`}>
      {message}
    </p>
  );
}

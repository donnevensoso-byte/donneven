"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage } from "@/app/actions/messages";
import { SubmitButton } from "./SubmitButton";

export function MessageForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(sendMessage.bind(null, bookingId), null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex items-end gap-2">
      <textarea
        name="body"
        rows={2}
        required
        className="input flex-1 resize-none"
        placeholder="Écrire un message…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <SubmitButton className="btn-primary" pendingLabel="…">Envoyer</SubmitButton>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

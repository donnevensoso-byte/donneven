"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/app/actions/reviews";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function ReviewForm({ bookingId, targetName }: { bookingId: string; targetName: string }) {
  const [state, action] = useActionState(submitReview.bind(null, bookingId), null);
  const [rating, setRating] = useState(0);
  if (state?.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={`text-3xl transition ${n <= rating ? "text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea name="comment" rows={3} required minLength={10} className="input" placeholder={`Comment s'est passée la location avec ${targetName} ?`} />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary" disabled={rating === 0}>Publier mon avis</SubmitButton>
    </form>
  );
}

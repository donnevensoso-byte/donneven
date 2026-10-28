/** Erreur dont le message peut être affiché tel quel à l'utilisateur. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

export function toActionError(err: unknown): ActionState {
  if (err instanceof UserError) return { error: err.message };
  // Les redirections de Next.js sont des exceptions à laisser remonter.
  if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) {
    throw err;
  }
  console.error(err);
  return { error: "Une erreur inattendue s'est produite. Réessayez dans un instant." };
}

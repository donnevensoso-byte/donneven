export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string[] | undefined> } | null;

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error)
    return <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>;
  if (state.success)
    return <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</p>;
  return null;
}

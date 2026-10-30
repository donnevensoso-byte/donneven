"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessageAction } from "@/app/actions/messages";

type Msg = { id: string; senderId: string | null; body: string; createdAt: string };

const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cayenne" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Cayenne" });

export function MessageThread({
  conversationId,
  currentUserId,
  initial,
  otherFirstName,
}: {
  conversationId: string;
  currentUserId: string;
  initial: Msg[];
  otherFirstName: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const lastAt = messages.at(-1)?.createdAt;

  // La conversation vient d'être marquée comme lue : met à jour les badges de l'en-tête.
  useEffect(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/conversations/${conversationId}${lastAt ? `?after=${encodeURIComponent(lastAt)}` : ""}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { messages: Msg[] };
        if (data.messages.length > 0) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...prev, ...data.messages.filter((m) => !known.has(m.id))];
          });
        }
      } catch {
        // réseau instable : on réessaie au prochain intervalle
      }
    }
    const timer = setInterval(poll, 4000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [conversationId, lastAt]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError(undefined);
    startTransition(async () => {
      const res = await sendMessageAction(conversationId, body);
      if (res.error) {
        setError(res.error);
        return;
      }
      setDraft("");
      const fresh = await fetch(`/api/conversations/${conversationId}${lastAt ? `?after=${encodeURIComponent(lastAt)}` : ""}`, { cache: "no-store" });
      if (fresh.ok) {
        const data = (await fresh.json()) as { messages: Msg[] };
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !known.has(m.id))];
        });
      }
    });
  }

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex-1 space-y-2 overflow-y-auto rounded-lg px-1 py-4 focus-visible:outline-2 focus-visible:outline-accent"
        role="log"
        aria-live="polite"
        aria-label="Messages de la conversation"
        tabIndex={0}
        data-testid="thread"
      >
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Posez votre question à {otherFirstName} : disponibilité, état du matériel, lieu de retrait…
          </p>
        )}
        {messages.map((m) => {
          const date = new Date(m.createdAt);
          const day = dayFmt.format(date);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs font-medium text-muted first-letter:uppercase">{day}</p>}
              {m.senderId === null ? (
                <p className="mx-auto my-2 max-w-md rounded-xl bg-sun-100 px-3 py-2 text-center text-xs text-ink">{m.body}</p>
              ) : (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] ${mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-line bg-white"}`}>
                    <p className="whitespace-pre-line break-words">{m.body}</p>
                    <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/90" : "text-muted"}`}>{timeFmt.format(date)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-line bg-white p-3">
        {error && <p className="field-error mb-2">{error}</p>}
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="message-body">Votre message</label>
          <textarea
            id="message-body"
            className="input max-h-40 min-h-11 flex-1 resize-none"
            rows={1}
            maxLength={2000}
            placeholder="Écrire un message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button type="submit" className="btn-primary h-11" disabled={pending || !draft.trim()}>
            {pending ? "…" : "Envoyer"}
          </button>
        </div>
      </form>
    </div>
  );
}

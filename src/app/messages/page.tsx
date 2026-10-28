import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, EmptyState, imageUrl, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { listConversations } from "@/lib/services/messages";
import { publicName, truncate } from "@/lib/text";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const conversations = await listConversations(user.id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Messages" />
      {conversations.length === 0 ? (
        <EmptyState icon="💬" title="Aucune conversation" action={{ href: "/recherche", label: "Parcourir les annonces" }}>
          Posez une question à un propriétaire depuis une annonce : la conversation apparaîtra ici.
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-sand" data-testid="conversation-row">
                <div className="relative">
                  <Avatar name={c.otherName} imageId={c.otherAvatarId} size={48} />
                  {c.listingImageId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(c.listingImageId, "thumb")} alt="" className="absolute -right-1 -bottom-1 size-6 rounded-md border-2 border-white object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>{publicName(c.otherName)}</p>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="truncate text-xs text-muted">{c.listingTitle}</p>
                  <p className={`truncate text-sm ${c.unread > 0 ? "font-semibold text-ink" : "text-muted"}`}>{truncate(c.lastBody ?? "", 90)}</p>
                </div>
                {c.unread > 0 && (
                  <span className="shrink-0 rounded-full bg-flame-500 px-2 text-xs leading-5 font-bold text-white" aria-label={`${c.unread} non lus`}>
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

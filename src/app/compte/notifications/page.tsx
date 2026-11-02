import type { Metadata } from "next";
import { markNotificationsReadAction } from "@/app/actions/account";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { listNotifications } from "@/lib/services/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/compte/notifications");
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.readAt).length;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Notifications"
        subtitle={
          notifications.length > 0 &&
          (unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}. Touchez une notification pour l'ouvrir : elle passe en « Lu ».` : "Tout est lu.")
        }
        actions={
          unread > 0 && (
            <form action={markNotificationsReadAction}>
              <button type="submit" className="btn-secondary">Tout marquer comme lu</button>
            </form>
          )
        }
      />
      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Rien de neuf">Vous serez prévenu ici des demandes, réponses et messages.</EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {notifications.map((n) => (
            <li key={n.id}>
              {/* Lien simple (pas de préchargement) : l'ouvrir marque la notification comme lue. */}
              <a href={`/compte/notifications/${n.id}`} className={`flex gap-3 p-4 hover:bg-sand ${n.readAt ? "" : "bg-brand-50/60"}`}>
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-flame-500"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={n.readAt ? "font-medium text-muted" : "font-semibold"}>{n.title}</p>
                    {n.readAt ? <span className="shrink-0 text-xs text-muted">Lu</span> : <Badge tone="red">Nouveau</Badge>}
                  </div>
                  <p className="text-sm text-muted">{n.body}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

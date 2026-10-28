import type { Metadata } from "next";
import Link from "next/link";
import { markNotificationsReadAction } from "@/app/actions/account";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { listNotifications } from "@/lib/services/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/compte/notifications");
  const notifications = await listNotifications(user.id);
  const unread = notifications.some((n) => !n.readAt);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Notifications"
        actions={
          unread && (
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
              <Link href={n.link} className={`flex gap-3 p-4 hover:bg-sand ${n.readAt ? "" : "bg-brand-50/60"}`}>
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-flame-500"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { markAllNotificationsRead } from "@/app/actions/profile";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/compte/notifications");
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const unread = items.some((n) => !n.readAt);
  return (
    <div className="container-app max-w-2xl py-8">
      <div className="flex items-center justify-between">
        <h1 className="heading text-3xl">Notifications</h1>
        {unread && (
          <form action={markAllNotificationsRead}>
            <button className="btn-ghost text-sm">Tout marquer comme lu</button>
          </form>
        )}
      </div>
      <ul className="mt-6 space-y-2">
        {items.length === 0 && <li className="text-slate-500">Rien de neuf pour le moment.</li>}
        {items.map((n) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{!n.readAt && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-flamboyant-500 align-middle" />}{n.title}</p>
                <span className="shrink-0 text-xs capitalize text-slate-400">{formatDateTime(n.createdAt, user.territory)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.body}</p>
            </>
          );
          return (
            <li key={n.id}>
              {n.link ? (
                <Link href={n.link} className={`card block p-4 hover:shadow-md ${n.readAt ? "" : "border-lagon-200 bg-lagon-50/40"}`}>{content}</Link>
              ) : (
                <div className="card p-4">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

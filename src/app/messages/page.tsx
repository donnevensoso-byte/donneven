import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { vehicleName } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Messages" };

export default async function InboxPage() {
  const user = await requireUser("/messages");
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ renterId: user.id }, { vehicle: { ownerId: user.id } }] },
    include: {
      vehicle: { include: { owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
      renter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: user.id } } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const threads = bookings
    .map((b) => ({ b, last: b.messages[0], other: b.renterId === user.id ? b.vehicle.owner : b.renter }))
    .sort((x, y) => (y.last?.createdAt ?? y.b.createdAt).getTime() - (x.last?.createdAt ?? x.b.createdAt).getTime());

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="heading text-3xl">Messages</h1>
      {threads.length === 0 ? (
        <p className="mt-6 text-slate-500">Vos conversations avec les propriétaires et locataires apparaîtront ici.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {threads.map(({ b, last, other }) => (
            <li key={b.id}>
              <Link href={`/reservations/${b.id}#messages`} className="flex gap-3 p-4 hover:bg-slate-50">
                <Avatar user={other} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate ${b._count.messages ? "font-bold" : "font-semibold"}`}>
                      {other.firstName} · <span className="font-normal text-slate-500">{vehicleName(b.vehicle)}</span>
                    </p>
                    {last && <span className="shrink-0 text-xs capitalize text-slate-400">{formatDateTime(last.createdAt, b.vehicle.territory)}</span>}
                  </div>
                  <p className={`truncate text-sm ${b._count.messages ? "text-encre" : "text-slate-500"}`}>
                    {last ? `${last.senderId === user.id ? "Vous : " : ""}${last.body}` : "Aucun message"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b._count.messages > 0 && <span className="rounded-full bg-flamboyant-500 px-2 text-xs font-bold text-white">{b._count.messages}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { and, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/message-thread";
import { Avatar, Badge, imageUrl } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, listings, users } from "@/lib/db/schema";
import { formatDateRange } from "@/lib/dates";
import { UserError } from "@/lib/errors";
import { formatEuros } from "@/lib/money";
import { bookingStatusLabel } from "@/lib/services/bookings";
import { getConversationThread, markConversationRead } from "@/lib/services/messages";
import { firstName, publicName } from "@/lib/text";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  let thread;
  try {
    thread = await getConversationThread(user.id, id);
  } catch (err) {
    if (err instanceof UserError) notFound();
    throw err;
  }
  const { conversation, messages } = thread;
  await markConversationRead(user.id, id);
  const otherId = conversation.renterId === user.id ? conversation.ownerId : conversation.renterId;
  const [[other], [listing], [activeBooking]] = await Promise.all([
    db.select({ id: users.id, name: users.name, avatarImageId: users.avatarImageId }).from(users).where(eq(users.id, otherId)).limit(1),
    db.select({ id: listings.id, title: listings.title, dayPrice: listings.dayPrice, status: listings.status }).from(listings).where(eq(listings.id, conversation.listingId)).limit(1),
    db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.listingId, conversation.listingId),
          eq(bookings.renterId, conversation.renterId),
          inArray(bookings.status, ["pending", "accepted", "ongoing", "completed"]),
        ),
      )
      .orderBy(desc(bookings.createdAt))
      .limit(1),
  ]);
  const cover = await db.query.listingImages.findFirst({
    where: (li, { eq: eqOp }) => eqOp(li.listingId, conversation.listingId),
    orderBy: (li, { asc }) => [asc(li.position)],
  });
  const isRenter = conversation.renterId === user.id;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem-4.25rem)] max-w-3xl flex-col px-4 pt-4 md:h-[calc(100dvh-4rem)] md:pb-4">
      <div className="card flex items-center gap-3 p-3">
        <Link href="/messages" className="btn-ghost px-2" aria-label="Retour aux messages">←</Link>
        <Avatar name={other.name} imageId={other.avatarImageId} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{publicName(other.name)}</p>
          <Link href={`/annonces/${listing.id}`} className="block truncate text-xs text-brand-600 hover:underline">
            {listing.title} · {formatEuros(listing.dayPrice)}/j
          </Link>
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(cover.imageId, "thumb")} alt="" className="size-11 rounded-lg object-cover" />
        )}
      </div>
      {activeBooking ? (
        <Link href={`/reservations/${activeBooking.id}`} className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm">
          <span className="truncate">📅 {formatDateRange(activeBooking.startDate, activeBooking.endDate)}</span>
          <Badge tone="green">{bookingStatusLabel(activeBooking)}</Badge>
        </Link>
      ) : (
        isRenter &&
        listing.status === "active" && (
          <Link href={`/annonces/${listing.id}#reserver`} className="mt-2 rounded-xl bg-sun-100 px-3 py-2 text-center text-sm font-semibold">
            Prêt à louer ? Choisissez vos dates →
          </Link>
        )
      )}
      <MessageThread
        conversationId={id}
        currentUserId={user.id}
        otherFirstName={firstName(other.name)}
        initial={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
    </div>
  );
}

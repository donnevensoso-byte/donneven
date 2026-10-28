import { and, asc, desc, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { conversations, listingImages, listings, messages, users } from "../db/schema";
import { UserError } from "../errors";
import { newId } from "../ids";
import { rateLimit } from "../rate-limit";
import { truncate } from "../text";
import { notify } from "./notifications";

export const MAX_MESSAGE_LENGTH = 2000;

/** Conversation entre un locataire potentiel et le propriétaire d'une annonce. */
export async function getOrCreateConversation(listingId: string, renterId: string): Promise<string> {
  const [listing] = await db
    .select({ ownerId: listings.ownerId, status: listings.status })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing || listing.status === "deleted") throw new UserError("Annonce introuvable.");
  if (listing.ownerId === renterId) throw new UserError("C'est votre propre annonce.");
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.listingId, listingId), eq(conversations.renterId, renterId)))
    .limit(1);
  if (existing) return existing.id;
  const id = newId();
  await db
    .insert(conversations)
    .values({ id, listingId, renterId, ownerId: listing.ownerId })
    .onConflictDoNothing();
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.listingId, listingId), eq(conversations.renterId, renterId)))
    .limit(1);
  return row!.id;
}

async function getParticipantConversation(userId: string, conversationId: string) {
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (!conv || (conv.renterId !== userId && conv.ownerId !== userId)) throw new UserError("Conversation introuvable.");
  return conv;
}

export async function sendMessage(
  senderId: string,
  conversationId: string,
  rawBody: string,
  opts: { silent?: boolean } = {},
): Promise<void> {
  const body = rawBody.trim();
  if (!body) throw new UserError("Le message est vide.");
  if (body.length > MAX_MESSAGE_LENGTH) throw new UserError(`${MAX_MESSAGE_LENGTH} caractères maximum.`);
  if (!rateLimit(`msg:${senderId}`, 30, 60_000)) throw new UserError("Vous envoyez trop de messages. Patientez une minute.");
  const conv = await getParticipantConversation(senderId, conversationId);
  const now = new Date();
  await db.insert(messages).values({ id: newId(), conversationId, senderId, body, createdAt: now });
  const isRenter = conv.renterId === senderId;
  await db
    .update(conversations)
    .set({ lastMessageAt: now, ...(isRenter ? { renterLastReadAt: now } : { ownerLastReadAt: now }) })
    .where(eq(conversations.id, conversationId));

  if (opts.silent) return;
  const recipientId = isRenter ? conv.ownerId : conv.renterId;
  const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, senderId)).limit(1);
  // Une notification (et un e-mail) par vague de messages : seulement si le
  // destinataire avait déjà lu le message précédent.
  const recipientLastRead = isRenter ? conv.ownerLastReadAt : conv.renterLastReadAt;
  const [previousUnread] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, recipientId),
        recipientLastRead ? gt(messages.createdAt, recipientLastRead) : sql`true`,
        lt(messages.createdAt, now),
      ),
    )
    .limit(1);
  if (!previousUnread) {
    await notify(recipientId, {
      title: `Nouveau message de ${sender?.name.split(" ")[0] ?? "quelqu'un"}`,
      body: truncate(body, 140),
      link: `/messages/${conversationId}`,
      email: true,
    });
  }
}

/** Message automatique (événement de réservation) visible par les deux parties. */
export async function postSystemMessage(conversationId: string, body: string): Promise<void> {
  const now = new Date();
  await db.insert(messages).values({ id: newId(), conversationId, senderId: null, body, createdAt: now });
  await db.update(conversations).set({ lastMessageAt: now }).where(eq(conversations.id, conversationId));
}

export async function listConversations(userId: string) {
  const other = sql<string>`case when ${conversations.renterId} = ${userId} then ${conversations.ownerId} else ${conversations.renterId} end`;
  const rows = await db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      listingTitle: listings.title,
      listingImageId: sql<string | null>`(select li.image_id from ${listingImages} li where li.listing_id = ${listings.id} order by li.position limit 1)`,
      renterId: conversations.renterId,
      ownerId: conversations.ownerId,
      lastMessageAt: conversations.lastMessageAt,
      otherId: other,
      otherName: sql<string>`(select u.name from ${users} u where u.id = ${other})`,
      otherAvatarId: sql<string | null>`(select u.avatar_image_id from ${users} u where u.id = ${other})`,
      lastBody: sql<string | null>`(select m.body from ${messages} m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
      lastReadAt: sql<Date | null>`case when ${conversations.renterId} = ${userId} then ${conversations.renterLastReadAt} else ${conversations.ownerLastReadAt} end`,
      unread: sql<number>`(select count(*)::int from ${messages} m where m.conversation_id = ${conversations.id}
        and (m.sender_id is null or m.sender_id <> ${userId})
        and m.created_at > coalesce(case when ${conversations.renterId} = ${userId} then ${conversations.renterLastReadAt} else ${conversations.ownerLastReadAt} end, 'epoch'))`,
    })
    .from(conversations)
    .innerJoin(listings, eq(listings.id, conversations.listingId))
    .where(
      and(
        or(eq(conversations.renterId, userId), eq(conversations.ownerId, userId)),
        sql`exists (select 1 from ${messages} m where m.conversation_id = ${conversations.id})`,
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(200);
  return rows;
}

export async function getConversationThread(userId: string, conversationId: string, after?: Date) {
  const conv = await getParticipantConversation(userId, conversationId);
  const thread = await db
    .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), after ? gt(messages.createdAt, after) : undefined))
    .orderBy(asc(messages.createdAt))
    .limit(500);
  return { conversation: conv, messages: thread };
}

export async function markConversationRead(userId: string, conversationId: string): Promise<void> {
  const now = new Date();
  await db
    .update(conversations)
    .set({ renterLastReadAt: now })
    .where(and(eq(conversations.id, conversationId), eq(conversations.renterId, userId)));
  await db
    .update(conversations)
    .set({ ownerLastReadAt: now })
    .where(and(eq(conversations.id, conversationId), eq(conversations.ownerId, userId)));
}

export async function unreadConversationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(conversations)
    .where(
      and(
        or(eq(conversations.renterId, userId), eq(conversations.ownerId, userId)),
        sql`exists (select 1 from ${messages} m where m.conversation_id = ${conversations.id}
          and (m.sender_id is null or m.sender_id <> ${userId})
          and m.created_at > coalesce(case when ${conversations.renterId} = ${userId} then ${conversations.renterLastReadAt} else ${conversations.ownerLastReadAt} end, 'epoch'))`,
      ),
    );
  return row?.n ?? 0;
}


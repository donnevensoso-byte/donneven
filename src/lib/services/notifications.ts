import { and, count, desc, eq, isNull } from "drizzle-orm";
import { appUrl } from "../config";
import { db } from "../db";
import { notifications, users } from "../db/schema";
import { sendEmail } from "../email";
import { newId } from "../ids";

type Notice = { title: string; body: string; link: string; email?: boolean };

/** Crée une notification dans l'application et, si demandé, l'envoie par e-mail. */
export async function notify(userId: string, notice: Notice): Promise<void> {
  await db.insert(notifications).values({ id: newId(), userId, title: notice.title, body: notice.body, link: notice.link });
  if (notice.email) {
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: notice.title,
        text: notice.body,
        actionUrl: `${appUrl()}${notice.link}`,
        actionLabel: "Voir sur Zouti",
      });
    }
  }
}

export async function listNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

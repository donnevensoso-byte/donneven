"use server";

import { requireUser } from "@/lib/auth";
import { toActionError, type ActionState } from "@/lib/errors";
import { sendMessage } from "@/lib/services/messages";

export async function sendMessageAction(conversationId: string, body: string): Promise<ActionState> {
  const user = await requireUser(`/messages/${conversationId}`);
  try {
    await sendMessage(user.id, conversationId, body);
  } catch (err) {
    return toActionError(err);
  }
  return { ok: true };
}

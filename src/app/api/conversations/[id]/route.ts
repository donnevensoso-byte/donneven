import { getCurrentUser } from "@/lib/auth";
import { UserError } from "@/lib/errors";
import { getConversationThread, markConversationRead } from "@/lib/services/messages";

export const dynamic = "force-dynamic";

/** Nouveaux messages d'une conversation (interrogé régulièrement par la page). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const afterParam = new URL(request.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;
  try {
    const { messages } = await getConversationThread(user.id, id, after && !Number.isNaN(after.getTime()) ? after : undefined);
    if (messages.length > 0) await markConversationRead(user.id, id);
    return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof UserError) return Response.json({ error: err.message }, { status: 404 });
    throw err;
  }
}

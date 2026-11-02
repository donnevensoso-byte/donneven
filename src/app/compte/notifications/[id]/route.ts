import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { openNotification } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

/** Ouvre une notification : la marque comme lue, puis mène à la page concernée. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent("/compte/notifications")}`);
  const { id } = await params;
  const link = await openNotification(user.id, id);
  // Lien interne uniquement : jamais de redirection vers un autre site.
  redirect(link && link.startsWith("/") && !link.startsWith("//") ? link : "/compte/notifications");
}

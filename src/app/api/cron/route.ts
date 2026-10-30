import { runScheduledJobs } from "@/lib/services/bookings";

export const dynamic = "force-dynamic";

/**
 * Tâches planifiées (expirations, rappels aux propriétaires, versements en échec).
 * À appeler toutes les 15 minutes avec l'en-tête « Authorization: Bearer $CRON_SECRET »
 * (Vercel Cron l'envoie tout seul ; ailleurs, un cron externe ou cron-job.org).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(await runScheduledJobs());
}

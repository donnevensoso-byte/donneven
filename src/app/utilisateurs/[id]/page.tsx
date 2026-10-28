import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { userRating, vehicleRatings } from "@/lib/queries";
import { formatDate } from "@/lib/dates";
import { getTerritory } from "@/lib/territories";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { VehicleCard } from "@/components/VehicleCard";

export const metadata: Metadata = { title: "Profil" };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true, bio: true, territory: true, createdAt: true, licenseStatus: true,
        vehicles: { where: { status: "ACTIVE" }, include: { photos: { orderBy: { position: "asc" }, take: 1 } } },
        reviewsReceived: { include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    getCurrentUser(),
  ]);
  if (!profile) notFound();
  const [rating, ratings] = await Promise.all([userRating(id), vehicleRatings(profile.vehicles.map((v) => v.id))]);

  return (
    <div className="container-app max-w-4xl py-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar user={profile} size={96} />
        <div>
          <h1 className="heading text-3xl">{profile.firstName} {profile.lastName[0]}.</h1>
          <p className="text-slate-500">{getTerritory(profile.territory).name} · membre depuis le {formatDate(profile.createdAt)}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Stars value={rating.avg} count={rating.count} size="md" />
            {profile.licenseStatus === "VERIFIED" && <span className="chip bg-emerald-100 text-emerald-800">✅ Permis vérifié</span>}
          </div>
        </div>
      </div>
      {profile.bio && <p className="card mt-6 whitespace-pre-line p-5 text-slate-700">{profile.bio}</p>}

      {profile.vehicles.length > 0 && (
        <section className="mt-10">
          <h2 className="heading text-xl">Ses véhicules</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profile.vehicles.map((v) => (
              <VehicleCard key={v.id} v={{ ...v, rating: ratings.get(v.id) ?? { avg: 0, count: 0 } }} loggedIn={Boolean(viewer)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="heading text-xl">Avis reçus ({rating.count})</h2>
        <ul className="mt-4 space-y-3">
          {profile.reviewsReceived.length === 0 && <li className="text-slate-500">Pas encore d&apos;avis.</li>}
          {profile.reviewsReceived.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar user={r.author} size={36} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.author.firstName} {r.author.lastName[0]}. <span className="font-normal text-slate-400">· {r.direction === "RENTER_TO_OWNER" ? "locataire" : "propriétaire"}</span></p>
                  <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                </div>
                <span className="text-amber-500">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{r.comment}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

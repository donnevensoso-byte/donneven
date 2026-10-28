import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { takenRanges, userRating, vehicleRatings } from "@/lib/queries";
import { busyDays } from "@/lib/availability";
import { isYoungDriver } from "@/lib/pricing";
import { dayInZone, formatDate } from "@/lib/dates";
import { blurPosition, findCommune, findHub, getTerritory } from "@/lib/territories";
import { CATEGORIES, FUELS, TRANSMISSIONS, type Category, type Fuel, type Transmission } from "@/lib/constants";
import { euros, splitList } from "@/lib/format";
import type { RawParams } from "@/lib/search-params";
import { VehicleImage } from "@/components/VehicleImage";
import { Stars } from "@/components/Stars";
import { Avatar } from "@/components/Avatar";
import { BookingWidget } from "@/components/BookingWidget";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { AreaMap } from "@/components/Maps";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Icon } from "@/components/Icon";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<RawParams> };

async function load(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      owner: true,
      photos: { orderBy: { position: "asc" } },
      reviews: {
        where: { direction: "RENTER_TO_OWNER" },
        include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await load((await params).id);
  if (!v) return {};
  return {
    title: `${v.make} ${v.model} à louer — ${v.commune}, ${getTerritory(v.territory).name}`,
    description: `Louez ce ${v.make} ${v.model} ${v.year} entre particuliers à ${v.commune} dès ${euros(v.pricePerDay)} par jour.`,
  };
}

export default async function VehiclePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [v, user] = await Promise.all([load(id), getCurrentUser()]);
  if (!v) notFound();
  const isOwner = user?.id === v.ownerId;
  if (v.status !== "ACTIVE" && !isOwner && user?.role !== "ADMIN") notFound();

  const territory = getTerritory(v.territory);
  const [taken, rating, ownerRating, ownerTrips, favorite] = await Promise.all([
    takenRanges(v.id),
    vehicleRatings([v.id]).then((m) => m.get(v.id) ?? { avg: 0, count: 0 }),
    userRating(v.ownerId),
    prisma.booking.count({ where: { vehicle: { ownerId: v.ownerId }, status: "COMPLETED" } }),
    user ? prisma.favorite.findUnique({ where: { userId_vehicleId: { userId: user.id, vehicleId: v.id } } }) : null,
  ]);
  const today = dayInZone(new Date(), v.territory);
  const commune = findCommune(v.territory, v.commune);
  const features = splitList(v.features);
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const specs: { icon: Parameters<typeof Icon>[0]["name"]; label: string }[] = [
    { icon: "car", label: CATEGORIES[v.category as Category]?.label ?? v.category },
    { icon: "gear", label: TRANSMISSIONS[v.transmission as Transmission] },
    { icon: "bolt", label: FUELS[v.fuel as Fuel] },
    ...(v.category !== "SCOOTER" ? [{ icon: "seat" as const, label: `${v.seats} places · ${v.doors} portes` }] : []),
    ...(v.airConditioning ? [{ icon: "snow" as const, label: "Climatisation" }] : []),
    { icon: "road", label: `${v.kmIncludedPerDay} km/jour inclus` },
  ];

  return (
    <div className="container-app pb-28 pt-6 lg:pb-10">
      <Link href={`/recherche?territoire=${v.territory}`} className="text-sm font-medium text-lagon-700 hover:underline">
        ← Véhicules en {territory.name}
      </Link>

      <Gallery photos={v.photos.map((p) => p.url)} category={v.category} color={v.color} alt={`${v.make} ${v.model}`}>
        <FavoriteButton vehicleId={v.id} initial={Boolean(favorite)} loggedIn={Boolean(user)} />
      </Gallery>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <section>
            {v.status !== "ACTIVE" && (
              <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">Cette annonce n&apos;est pas visible publiquement ({v.status}).</p>
            )}
            <h1 className="heading text-3xl md:text-4xl">{v.make} {v.model} <span className="text-slate-400">{v.year}</span></h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
              <span className="flex items-center gap-1"><Icon name="pin" className="h-4 w-4" /> {v.commune}{commune?.island ? ` (${commune.island})` : ""}, {territory.name}</span>
              <Stars value={rating.avg} count={rating.count} />
              {v.instantBooking && <span className="chip bg-lagon-100 text-lagon-800">⚡ Réservation instantanée</span>}
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((s) => (
                <li key={s.label} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-slate-200">
                  <Icon name={s.icon} className="h-5 w-5 text-lagon-600" /> {s.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <LocalPerk ok={v.airportDelivery} icon="plane" title="Livraison à l'aéroport" text={v.airportDelivery ? `${findHub(v.territory, "AEROPORT")?.name} · ${euros(v.airportFee)}` : "Non proposée"} />
            <LocalPerk ok={v.portDelivery} icon="boat" title="Livraison au port" text={v.portDelivery ? `${findHub(v.territory, "PORT")?.name} · ${euros(v.portFee)}` : "Non proposée"} />
            {territory.ferryDestinations.length > 0 && (
              <LocalPerk ok={v.ferryAllowed} icon="boat" title="Passage en ferry" text={v.ferryAllowed ? `Autorisé vers ${territory.ferryDestinations.join(", ")}` : "Non autorisé"} />
            )}
            {v.territory === "guyane" && (
              <LocalPerk ok={v.trackAllowed} icon="road" title="Pistes / latérite" text={v.trackAllowed ? "Autorisées par le propriétaire" : "Routes goudronnées uniquement"} />
            )}
          </section>

          {v.description && (
            <section>
              <h2 className="heading text-xl">Le mot du propriétaire</h2>
              <p className="mt-3 whitespace-pre-line text-slate-700">{v.description}</p>
            </section>
          )}

          {features.length > 0 && (
            <section>
              <h2 className="heading text-xl">Équipements</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-lagon-600" /> {f}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="heading text-xl">Conditions</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Durée : de {v.minDays} à {v.maxDays} jours</li>
              <li>• {v.kmIncludedPerDay} km inclus par jour, puis {euros(v.extraKmPrice, { decimals: true })} / km</li>
              <li>• Caution : {euros(v.depositAmount)} (empreinte bancaire, non débitée)</li>
              <li>• Carburant : rendre le véhicule avec le même niveau qu&apos;au départ</li>
              {v.rules && <li className="whitespace-pre-line">• {v.rules}</li>}
            </ul>
          </section>

          <section>
            <h2 className="heading text-xl">Disponibilités</h2>
            <div className="card mt-4 p-4">
              <AvailabilityCalendar busy={[...busyDays(taken, territory.timeZone)]} today={today} />
            </div>
          </section>

          <section>
            <h2 className="heading text-xl">Où se trouve le véhicule</h2>
            <p className="mt-1 text-sm text-slate-500">Zone approximative. L&apos;adresse exacte vous sera communiquée après confirmation.</p>
            <div className="mt-4 h-72">
              <AreaMap center={blurPosition(v.lat, v.lng, v.id)} />
            </div>
          </section>

          <section>
            <h2 className="heading text-xl">Votre propriétaire</h2>
            <Link href={`/utilisateurs/${v.owner.id}`} className="card mt-4 flex items-center gap-4 p-5 hover:shadow-md">
              <Avatar user={v.owner} size={56} />
              <div>
                <p className="font-semibold">{v.owner.firstName} {v.owner.lastName[0]}.</p>
                <p className="text-sm text-slate-500">
                  Membre depuis {formatDate(v.owner.createdAt).split(" ").slice(1).join(" ")} · {ownerTrips} location(s)
                </p>
                <Stars value={ownerRating.avg} count={ownerRating.count} />
              </div>
            </Link>
          </section>

          <section>
            <h2 className="heading text-xl">Avis ({rating.count})</h2>
            {v.reviews.length === 0 ? (
              <p className="mt-3 text-slate-500">Pas encore d&apos;avis. Soyez le premier à louer ce véhicule !</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {v.reviews.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={r.author} size={36} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{r.author.firstName} {r.author.lastName[0]}.</p>
                        <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                      </div>
                      <span className="text-amber-500">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-lagon-50 p-5">
            <h2 className="font-semibold text-lagon-900">Conseils pour rouler en {territory.name}</h2>
            <ul className="mt-2 space-y-1 text-sm text-lagon-900/80">
              {territory.tips.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BookingWidget
            vehicleId={v.id}
            // uniquement les champs de tarification : ne jamais sérialiser `v.owner` vers le navigateur
            vehicle={{
              category: v.category,
              pricePerDay: v.pricePerDay,
              weeklyDiscountPct: v.weeklyDiscountPct,
              monthlyDiscountPct: v.monthlyDiscountPct,
              depositAmount: v.depositAmount,
              airportDelivery: v.airportDelivery,
              airportFee: v.airportFee,
              portDelivery: v.portDelivery,
              portFee: v.portFee,
              instantBooking: v.instantBooking,
              minDays: v.minDays,
              maxDays: v.maxDays,
            }}
            utcOffset={territory.utcOffset}
            hubs={{ AEROPORT: findHub(v.territory, "AEROPORT")?.name, PORT: findHub(v.territory, "PORT")?.name }}
            taken={taken.map((t) => ({ startAt: t.startAt.toISOString(), endAt: t.endAt.toISOString() }))}
            defaults={{ debut: one("debut"), fin: one("fin"), hdebut: one("hdebut"), hfin: one("hfin"), livraison: one("livraison") }}
            today={today}
            user={{
              loggedIn: Boolean(user),
              isOwner,
              youngDriver: isYoungDriver(user?.licenseIssuedAt),
              licenseOk: Boolean(user && ["PENDING", "VERIFIED"].includes(user.licenseStatus)),
            }}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[60px] z-30 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        <p><span className="text-lg font-bold">{euros(v.pricePerDay)}</span><span className="text-sm text-slate-500"> / jour</span></p>
        <a href="#reserver" className="btn-accent">{v.instantBooking ? "⚡ Réserver" : "Faire une demande"}</a>
      </div>
    </div>
  );
}

function Gallery({ photos, category, color, alt, children }: { photos: string[]; category: string; color: string; alt: string; children: React.ReactNode }) {
  const [main, ...rest] = photos;
  return (
    <div className="relative mt-4">
      <div className="absolute right-3 top-3 z-10">{children}</div>
      {photos.length <= 1 ? (
        <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-lagon-50 md:aspect-[21/9]">
          <VehicleImage photo={main} category={category} color={color} alt={alt} />
        </div>
      ) : (
        <div className="grid h-[260px] gap-2 overflow-hidden rounded-3xl md:h-[420px] md:grid-cols-4 md:grid-rows-2">
          <div className="md:col-span-2 md:row-span-2"><VehicleImage photo={main} category={category} color={color} alt={alt} /></div>
          {rest.slice(0, 4).map((p, i) => (
            <div key={p} className="hidden md:block"><VehicleImage photo={p} category={category} color={color} alt={`${alt} — photo ${i + 2}`} /></div>
          ))}
        </div>
      )}
    </div>
  );
}

function LocalPerk({ ok, icon, title, text }: { ok: boolean; icon: Parameters<typeof Icon>[0]["name"]; title: string; text: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl p-4 ring-1 ${ok ? "bg-white ring-lagon-200" : "bg-slate-50 ring-slate-200"}`}>
      <span className={`rounded-full p-2 ${ok ? "bg-lagon-100 text-lagon-700" : "bg-slate-200 text-slate-400"}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className={`font-semibold ${ok ? "" : "text-slate-500"}`}>{title}</p>
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

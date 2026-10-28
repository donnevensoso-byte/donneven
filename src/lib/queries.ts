import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { BLOCKING_STATUSES, WEATHER_LEVELS, type WeatherLevel } from "./constants";
import { isRangeFree, type Range } from "./availability";
import { distanceKm, findCommune, findHub, getTerritory } from "./territories";

export type SearchFilters = {
  territory: string;
  commune?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  category?: string;
  transmission?: string;
  maxPrice?: number;
  delivery?: "AEROPORT" | "PORT";
  instant?: boolean;
  seats?: number;
  track?: boolean;
  ferry?: boolean;
  sort?: "pertinence" | "prix" | "note" | "distance";
};

export async function takenRanges(vehicleId: string, excludeBookingId?: string): Promise<Range[]> {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        vehicleId,
        status: { in: BLOCKING_STATUSES },
        endAt: { gt: new Date() },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { startAt: true, endAt: true },
    }),
    prisma.vehicleBlock.findMany({
      where: { vehicleId, endAt: { gt: new Date() } },
      select: { startAt: true, endAt: true },
    }),
  ]);
  return [...bookings, ...blocks];
}

export async function vehicleRatings(vehicleIds: string[]) {
  if (vehicleIds.length === 0) return new Map<string, { avg: number; count: number }>();
  const rows = await prisma.review.groupBy({
    by: ["vehicleId"],
    where: { vehicleId: { in: vehicleIds }, direction: "RENTER_TO_OWNER" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.vehicleId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

export async function userRating(userId: string) {
  const r = await prisma.review.aggregate({
    where: { targetUserId: userId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return { avg: r._avg.rating ?? 0, count: r._count._all };
}

export async function searchVehicles(f: SearchFilters) {
  const where: Prisma.VehicleWhereInput = {
    status: "ACTIVE",
    territory: f.territory,
    ...(f.commune ? { commune: f.commune } : {}),
    ...(f.category ? { category: f.category } : {}),
    ...(f.transmission ? { transmission: f.transmission } : {}),
    ...(f.maxPrice ? { pricePerDay: { lte: f.maxPrice } } : {}),
    ...(f.delivery === "AEROPORT" ? { airportDelivery: true } : {}),
    ...(f.delivery === "PORT" ? { portDelivery: true } : {}),
    ...(f.instant ? { instantBooking: true } : {}),
    ...(f.seats ? { seats: { gte: f.seats } } : {}),
    ...(f.track ? { trackAllowed: true } : {}),
    ...(f.ferry ? { ferryAllowed: true } : {}),
  };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      photos: { orderBy: { position: "asc" }, take: 1 },
      owner: { select: { firstName: true, avatarUrl: true } },
      bookings: f.startAt && f.endAt
        ? { where: { status: { in: BLOCKING_STATUSES }, startAt: { lt: f.endAt }, endAt: { gt: f.startAt } }, select: { startAt: true, endAt: true } }
        : false,
      blocks: f.startAt && f.endAt
        ? { where: { startAt: { lt: f.endAt }, endAt: { gt: f.startAt } }, select: { startAt: true, endAt: true } }
        : false,
    },
    take: 200,
  });

  const available = vehicles.filter((v) => {
    if (!f.startAt || !f.endAt) return true;
    const taken = [...(v.bookings ?? []), ...(v.blocks ?? [])];
    return isRangeFree({ startAt: f.startAt, endAt: f.endAt }, taken);
  });

  const ratings = await vehicleRatings(available.map((v) => v.id));
  const origin = searchOrigin(f);

  const results = available.map((v) => ({
    ...v,
    rating: ratings.get(v.id) ?? { avg: 0, count: 0 },
    distance: distanceKm(origin, [v.lat, v.lng]),
  }));

  switch (f.sort) {
    case "prix":
      results.sort((a, b) => a.pricePerDay - b.pricePerDay);
      break;
    case "note":
      results.sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count);
      break;
    case "distance":
      results.sort((a, b) => a.distance - b.distance);
      break;
    default:
      // pertinence : réservation instantanée et bien notés en premier, puis proximité
      results.sort(
        (a, b) =>
          Number(b.instantBooking) - Number(a.instantBooking) ||
          b.rating.avg * Math.log2(2 + b.rating.count) - a.rating.avg * Math.log2(2 + a.rating.count) ||
          a.distance - b.distance,
      );
  }
  return results;
}

/** Point de référence pour le calcul des distances : hub de livraison, commune ou centre du territoire. */
function searchOrigin(f: SearchFilters): [number, number] {
  const place = f.delivery ? findHub(f.territory, f.delivery) : f.commune ? findCommune(f.territory, f.commune) : undefined;
  return place ? [place.lat, place.lng] : getTerritory(f.territory).center;
}

export type SearchResult =Awaited<ReturnType<typeof searchVehicles>>[number];

export async function activeAlert(territory: string) {
  return prisma.weatherAlert.findFirst({
    where: { territory, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasSevereWeather(territory: string): Promise<boolean> {
  const alert = await activeAlert(territory);
  return Boolean(alert && WEATHER_LEVELS[alert.level as WeatherLevel]?.severe);
}

export async function unreadCounts(userId: string) {
  const [notifications, messages] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        booking: { OR: [{ renterId: userId }, { vehicle: { ownerId: userId } }] },
      },
    }),
  ]);
  return { notifications, messages };
}

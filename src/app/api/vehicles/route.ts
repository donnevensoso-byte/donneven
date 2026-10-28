import { searchVehicles } from "@/lib/queries";
import { parseSearchParams } from "@/lib/search-params";

/** API publique de recherche (pour une future application native iOS / Android). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = parseSearchParams(Object.fromEntries(url.searchParams));
  const results = await searchVehicles(filters);
  return Response.json({
    count: results.length,
    vehicles: results.map((v) => ({
      id: v.id,
      name: `${v.make} ${v.model}`,
      year: v.year,
      category: v.category,
      transmission: v.transmission,
      seats: v.seats,
      commune: v.commune,
      territory: v.territory,
      pricePerDay: v.pricePerDay,
      instantBooking: v.instantBooking,
      airportDelivery: v.airportDelivery,
      rating: v.rating,
      position: { lat: v.lat, lng: v.lng },
      photo: v.photos[0]?.url ?? null,
    })),
  });
}

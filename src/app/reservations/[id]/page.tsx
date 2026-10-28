import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expireStaleRequests, loadBookingFor } from "@/lib/bookings";
import { hasSevereWeather, userRating } from "@/lib/queries";
import { computeCancellation } from "@/lib/cancellation";
import { formatDateTime } from "@/lib/dates";
import { euros, vehicleName } from "@/lib/format";
import { ageAt } from "@/lib/pricing";
import { findHub, getTerritory } from "@/lib/territories";
import { INSURANCE_PLANS, PICKUP_OPTIONS, type BookingStatus, type InsurancePlan, type PickupOption } from "@/lib/constants";
import { respondToRequest, payBooking } from "@/app/actions/bookings";
import { StatusBadge } from "@/components/StatusBadge";
import { VehicleImage } from "@/components/VehicleImage";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { PriceDetails } from "@/components/PriceDetails";
import { MessageForm } from "@/components/MessageForm";
import { InspectionForm } from "@/components/InspectionForm";
import { ReviewForm } from "@/components/ReviewForm";
import { CancelForm } from "@/components/CancelForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SubmitButton } from "@/components/SubmitButton";
import { AreaMap } from "@/components/Maps";

export const metadata: Metadata = { title: "Ma réservation" };

const STEPS: { status: BookingStatus[]; label: string }[] = [
  { status: ["PENDING"], label: "Demande" },
  { status: ["AWAITING_PAYMENT"], label: "Paiement" },
  { status: ["CONFIRMED"], label: "Confirmée" },
  { status: ["IN_PROGRESS"], label: "En cours" },
  { status: ["COMPLETED"], label: "Terminée" },
];

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paiement?: string }> }) {
  const { id } = await params;
  const { paiement } = await searchParams;
  const user = await requireUser(`/reservations/${id}`);
  await expireStaleRequests();
  const ctx = await loadBookingFor(id, user.id, user.role === "ADMIN");
  if (!ctx) notFound();
  const { booking: b, role } = ctx;
  const v = b.vehicle;
  const territory = getTerritory(v.territory);
  const other = role === "RENTER" ? v.owner : b.renter;
  const status = b.status as BookingStatus;
  const confirmed = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(status);

  const [messages, inspections, myReview, otherRating, otherTrips, severe] = await Promise.all([
    prisma.message.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } }),
    prisma.inspection.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" } }),
    prisma.review.findUnique({ where: { bookingId_authorId: { bookingId: id, authorId: user.id } } }),
    userRating(other.id),
    prisma.booking.count({ where: role === "RENTER" ? { vehicle: { ownerId: other.id }, status: "COMPLETED" } : { renterId: other.id, status: "COMPLETED" } }),
    hasSevereWeather(v.territory),
  ]);
  if (role !== "ADMIN") {
    await prisma.message.updateMany({ where: { bookingId: id, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });
  }

  const cancellation = computeCancellation({
    status,
    paid: b.paymentStatus === "PAID",
    total: b.total,
    serviceFee: b.serviceFee,
    startAt: b.startAt,
    now: new Date(),
    by: role,
    severeWeather: severe,
  });
  const checkin = inspections.find((i) => i.type === "CHECKIN");
  const checkout = inspections.find((i) => i.type === "CHECKOUT");
  const drivenKm = checkin && checkout ? checkout.mileage - checkin.mileage : null;
  const extraKm = drivenKm !== null ? Math.max(0, drivenKm - v.kmIncludedPerDay * b.days) : 0;
  const pickupPoint = b.pickupOption === "SUR_PLACE" ? null : findHub(v.territory, b.pickupOption as "AEROPORT" | "PORT");
  const stepIndex = STEPS.findIndex((s) => s.status.includes(status));

  return (
    <div className="container-app max-w-5xl py-6">
      <AutoRefresh seconds={20} />
      <Link href={role === "OWNER" ? "/proprietaire" : "/compte/locations"} className="text-sm font-medium text-lagon-700 hover:underline">
        ← {role === "OWNER" ? "Espace propriétaire" : "Mes locations"}
      </Link>

      {paiement === "ok" && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">✅ Paiement confirmé ! Votre location est réservée.</p>}
      {paiement === "annule" && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-amber-800">Le paiement a été interrompu. Vous pouvez réessayer ci-dessous.</p>}

      <div className="card mt-4 flex flex-col gap-4 overflow-hidden sm:flex-row">
        <div className="aspect-[16/10] w-full shrink-0 bg-lagon-50 sm:w-64">
          <VehicleImage photo={v.photos[0]?.url} category={v.category} color={v.color} alt={vehicleName(v)} />
        </div>
        <div className="flex-1 p-4 sm:pl-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs text-slate-400">Réf. {b.id.slice(-8).toUpperCase()}</span>
          </div>
          <h1 className="heading mt-2 text-2xl">
            <Link href={`/vehicules/${v.id}`} className="hover:underline">{vehicleName(v)}</Link>
          </h1>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Départ</dt>
              <dd className="font-medium capitalize">{formatDateTime(b.startAt, v.territory)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Retour</dt>
              <dd className="font-medium capitalize">{formatDateTime(b.endAt, v.territory)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Remise des clés</dt>
              <dd className="font-medium">{PICKUP_OPTIONS[b.pickupOption as PickupOption]} — {b.pickupLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Assurance</dt>
              <dd className="font-medium">{INSURANCE_PLANS[b.insurancePlan as InsurancePlan]?.label}</dd>
            </div>
          </dl>
        </div>
      </div>

      {!["CANCELLED", "DECLINED"].includes(status) && (
        <ol className="mt-6 grid grid-cols-5 gap-1 text-center text-xs font-medium">
          {STEPS.map((s, i) => (
            <li key={s.label}>
              <div className={`mb-1.5 h-1.5 rounded-full ${i <= stepIndex ? "bg-lagon-500" : "bg-slate-200"}`} />
              <span className={i <= stepIndex ? "text-lagon-800" : "text-slate-400"}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <NextStep>
            {status === "PENDING" && role === "OWNER" && (
              <>
                <h2 className="font-semibold">{b.renter.firstName} attend votre réponse</h2>
                <p className="mt-1 text-sm text-slate-600">Répondez sous 24 h, sinon la demande expirera automatiquement. Vous toucherez {euros(b.ownerPayout)}.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={respondToRequest.bind(null, b.id, true)}><SubmitButton className="btn-primary">Accepter</SubmitButton></form>
                  <form action={respondToRequest.bind(null, b.id, false)}><SubmitButton className="btn-outline">Refuser</SubmitButton></form>
                </div>
              </>
            )}
            {status === "PENDING" && role === "RENTER" && (
              <>
                <h2 className="font-semibold">Demande envoyée à {v.owner.firstName}</h2>
                <p className="mt-1 text-sm text-slate-600">Vous recevrez une notification dès qu&apos;il ou elle aura répondu (24 h maximum). Aucun montant n&apos;est débité pour l&apos;instant.</p>
              </>
            )}
            {status === "AWAITING_PAYMENT" && role === "RENTER" && (
              <>
                <h2 className="font-semibold">Plus qu&apos;une étape : le paiement</h2>
                <p className="mt-1 text-sm text-slate-600">Réglez {euros(b.total)} pour confirmer. Une empreinte de caution de {euros(b.deposit)} sera prise au départ.</p>
                <form action={payBooking.bind(null, b.id)} className="mt-4">
                  <SubmitButton className="btn-accent">Payer {euros(b.total)}</SubmitButton>
                </form>
              </>
            )}
            {status === "AWAITING_PAYMENT" && role === "OWNER" && (
              <p className="text-sm text-slate-600">Demande acceptée. En attente du paiement de {b.renter.firstName}.</p>
            )}
            {status === "CONFIRMED" && role !== "ADMIN" && (
              <>
                <h2 className="font-semibold">État des lieux de départ</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Le jour J, faites le tour du véhicule ensemble, prenez des photos et relevez le compteur. Cela démarre la location.
                </p>
                <div className="mt-4"><InspectionForm bookingId={b.id} type="CHECKIN" /></div>
              </>
            )}
            {status === "IN_PROGRESS" && role !== "ADMIN" && (
              <>
                <h2 className="font-semibold">Retour du véhicule</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Kilométrage au départ : {checkin?.mileage ?? "—"} km · inclus : {v.kmIncludedPerDay * b.days} km.
                </p>
                <div className="mt-4"><InspectionForm bookingId={b.id} type="CHECKOUT" minMileage={checkin?.mileage} /></div>
              </>
            )}
            {status === "COMPLETED" && role !== "ADMIN" && (
              <>
                <h2 className="font-semibold">Location terminée — mèsi !</h2>
                {drivenKm !== null && (
                  <p className="mt-1 text-sm text-slate-600">
                    {drivenKm} km parcourus.{" "}
                    {extraKm > 0
                      ? `${extraKm} km au-delà du forfait, soit ${euros(extraKm * v.extraKmPrice)} à régler au propriétaire.`
                      : "Forfait kilométrique respecté."}
                    {checkin && checkout && checkout.fuelLevel < checkin.fuelLevel && " Niveau de carburant inférieur au départ : un complément peut être demandé."}
                  </p>
                )}
                <div className="mt-4">
                  {myReview ? (
                    <p className="text-sm text-slate-600">Mèsi ! Vous avez noté cette location <span className="text-amber-500">{"★".repeat(myReview.rating)}</span>.</p>
                  ) : (
                    <ReviewForm bookingId={b.id} targetName={other.firstName} />
                  )}
                </div>
              </>
            )}
            {(status === "CANCELLED" || status === "DECLINED") && (
              <>
                <h2 className="font-semibold">{status === "CANCELLED" ? "Réservation annulée" : "Demande non aboutie"}</h2>
                {b.cancelReason && <p className="mt-1 text-sm text-slate-600">{b.cancelReason}</p>}
                {b.refundAmount > 0 && (
                  <p className="mt-1 text-sm text-slate-600">
                    Remboursement de {euros(b.refundAmount)}{b.refundAmount >= b.total ? " (intégral)" : ""} sous 5 à 10 jours.
                  </p>
                )}
                {role === "RENTER" && <Link href={`/recherche?territoire=${v.territory}`} className="btn-primary mt-4">Trouver un autre véhicule</Link>}
              </>
            )}
          </NextStep>

          {inspections.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold">États des lieux</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {inspections.map((i) => (
                  <div key={i.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">{i.type === "CHECKIN" ? "Départ" : "Retour"} · {formatDateTime(i.createdAt, v.territory)}</p>
                    <p>Compteur : {i.mileage} km · Carburant : {i.fuelLevel}/8 · {i.cleanliness.toLowerCase()}</p>
                    {i.damages && <p className="text-slate-600">Dommages : {i.damages}</p>}
                    {i.photos && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {i.photos.split(",").map((p) => (
                          <a key={p} href={p} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p} alt="Photo état des lieux" className="h-14 w-14 rounded-lg object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="messages" className="card p-5">
            <h2 className="font-semibold">Messages avec {other.firstName}</h2>
            <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
              {messages.length === 0 && <li className="text-sm text-slate-500">Aucun message pour l&apos;instant. Dites bonjou !</li>}
              {messages.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <li key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    <Avatar user={m.sender} size={30} />
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-tr-sm bg-lagon-600 text-white" : "rounded-tl-sm bg-slate-100"}`}>
                      <p className="whitespace-pre-line">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>{formatDateTime(m.createdAt, v.territory)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {role !== "ADMIN" && !["CANCELLED", "DECLINED"].includes(status) && (
              <div className="mt-4">
                <MessageForm bookingId={b.id} />
                {!confirmed && <p className="mt-2 text-xs text-slate-400">Pour votre sécurité, ne partagez pas de coordonnées avant la confirmation : elles s&apos;afficheront automatiquement.</p>}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-slate-500">{role === "RENTER" ? "Propriétaire" : "Locataire"}</p>
            <Link href={`/utilisateurs/${other.id}`} className="mt-2 flex items-center gap-3">
              <Avatar user={other} size={48} />
              <div>
                <p className="font-semibold">{other.firstName} {other.lastName[0]}.</p>
                <Stars value={otherRating.avg} count={otherRating.count} />
              </div>
            </Link>
            <p className="mt-2 text-xs text-slate-500">{otherTrips} location(s) réalisée(s)</p>
            {role === "OWNER" && (
              <ul className="mt-3 space-y-1 text-sm">
                <li>Permis : {b.renter.licenseStatus === "VERIFIED" ? "✅ vérifié" : b.renter.licenseStatus === "PENDING" ? "⏳ en cours de vérification" : "❌ non fourni"}</li>
                {b.renter.licenseIssuedAt && <li>Permis obtenu en {b.renter.licenseIssuedAt.getFullYear()}</li>}
                {b.renter.birthDate && <li>{ageAt(b.renter.birthDate)} ans</li>}
              </ul>
            )}
            {confirmed && (
              <div className="mt-4 space-y-1 rounded-xl bg-lagon-50 p-3 text-sm">
                {other.phone && <p>📞 <a href={`tel:${other.phone.replace(/\s/g, "")}`} className="font-semibold text-lagon-800">{other.phone}</a></p>}
                {other.phone && (
                  <p>💬 <a href={`https://wa.me/${other.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="font-semibold text-lagon-800">WhatsApp</a></p>
                )}
                {role === "RENTER" && b.pickupOption === "SUR_PLACE" && <p>📍 {v.address || v.commune}</p>}
              </div>
            )}
          </div>

          {confirmed && role === "RENTER" && (
            <div className="h-56">
              <AreaMap center={pickupPoint ? [pickupPoint.lat, pickupPoint.lng] : [v.lat, v.lng]} exact />
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-3 font-semibold">{role === "OWNER" ? "Vos revenus" : "Détail du prix"}</h2>
            <PriceDetails p={b} plan={b.insurancePlan} showOwner={role !== "RENTER"} />
            <p className="mt-3 text-xs text-slate-500">
              Paiement : {b.paymentStatus === "PAID" ? "effectué" : b.paymentStatus === "REFUNDED" ? "remboursé" : b.paymentStatus === "PARTIALLY_REFUNDED" ? "partiellement remboursé" : "en attente"} · Heure locale {territory.name}
            </p>
          </div>

          {cancellation.allowed && role !== "ADMIN" && (
            <div className="card p-5">
              <CancelForm bookingId={b.id} policy={cancellation.policy + (cancellation.refund ? ` ${role === "RENTER" ? "Vous serez remboursé" : "Le locataire sera remboursé"} de ${euros(cancellation.refund)}.` : "")} />
              {severe && <p className="mt-2 text-xs font-semibold text-purple-700">🌀 Garantie Cyclone active sur {territory.name}.</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function NextStep({ children }: { children: React.ReactNode }) {
  return <section className="card border-l-4 border-l-lagon-500 p-5">{children}</section>;
}

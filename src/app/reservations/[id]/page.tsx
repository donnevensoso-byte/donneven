import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CancelForm,
  HandoverForm,
  PayButton,
  RespondForm,
  ReturnButton,
  ReviewForm,
} from "@/components/booking-controls";
import { BookingPhotosForm } from "@/components/booking-photos";
import { Alert, Avatar, Badge, imageUrl } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, formatDate, formatDateRange, formatDateTime, todayInGuyane } from "@/lib/dates";
import { communeName } from "@/lib/guyane";
import { formatEuros } from "@/lib/money";
import { bookingStatusLabel, getBookingForUser } from "@/lib/services/bookings";
import { listBookingPhotos, MAX_PHOTOS_PER_STAGE, openPhotoStages, STAGE_LABELS } from "@/lib/services/booking-photos";
import { canReview } from "@/lib/services/reviews";
import { firstName, publicName, whatsappNumber } from "@/lib/text";

export const metadata: Metadata = { title: "Réservation", robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ envoyee?: string; paiement?: string }> };

const STEPS = ["Demande", "Confirmée", "Remise", "Rendue"] as const;

function stepIndex(status: string, paid: boolean): number {
  switch (status) {
    case "pending":
      return 0;
    case "accepted":
      return paid ? 1 : 0.5;
    case "ongoing":
      return 2;
    case "completed":
      return 3;
    default:
      return -1;
  }
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const flags = await searchParams;
  const user = await requireUser(`/reservations/${id}`);

  if (flags.paiement?.startsWith("cs_")) {
    const { syncCheckoutSession } = await import("@/lib/services/payments");
    await syncCheckoutSession(flags.paiement).catch((err) => console.error("syncCheckoutSession", err));
  }

  const data = await getBookingForUser(user.id, id);
  if (!data) notFound();
  const { booking, listing, listingImageId, role, other, reviews, conversationId } = data;
  const isOwner = role === "owner";
  const online = booking.paymentMethod === "online";
  const paid = !online || booking.paymentStatus === "paid";
  const today = todayInGuyane();
  const total = booking.rentalAmount + booking.serviceFee;
  const step = stepIndex(booking.status, paid);
  const confirmed = ["accepted", "ongoing", "completed"].includes(booking.status) && paid;
  const myReview = reviews.find((r) => r.authorId === user.id);
  const theirReview = reviews.find((r) => r.authorId !== user.id);
  const wa = whatsappNumber(other.phone);
  const photos = await listBookingPhotos(booking.id);
  const photoStages = openPhotoStages(booking);
  const statusTone =
    booking.status === "pending" || (booking.status === "accepted" && !paid)
      ? "yellow"
      : ["declined", "cancelled", "expired"].includes(booking.status)
        ? "red"
        : "green";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/reservations" className="text-sm text-brand-600 hover:underline">← Mes réservations</Link>
      {flags.envoyee && (
        <div className="mt-4">
          <Alert tone="success">
            Demande envoyée ! {firstName(other.name)} a 48 h pour répondre. Vous serez prévenu par notification
            {" "}et par e-mail.
          </Alert>
        </div>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="card flex gap-4 p-4">
            <Link href={`/annonces/${listing.id}`} className="size-24 shrink-0 overflow-hidden rounded-xl bg-line">
              {listingImageId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(listingImageId, "thumb")} alt="" className="size-full object-cover" />
              )}
            </Link>
            <div className="min-w-0">
              <Badge tone={statusTone}>{bookingStatusLabel(booking)}</Badge>
              <h1 className="mt-1.5 text-xl font-bold">
                <Link href={`/annonces/${listing.id}`} className="hover:underline">{listing.title}</Link>
              </h1>
              <p className="text-sm text-muted">
                {formatDateRange(booking.startDate, booking.endDate)} · {booking.days} jour{booking.days > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted">📍 {communeName(listing.commune)}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</p>
            </div>
          </div>

          {step >= 0 && (
            <ol className="grid grid-cols-4 gap-1 text-center text-xs font-medium" aria-label="Étapes">
              {STEPS.map((label, i) => (
                <li key={label}>
                  <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand-600" : "bg-line"}`} />
                  <span className={`mt-1 block ${i <= step ? "text-brand-700" : "text-muted"}`}>{label}</span>
                </li>
              ))}
            </ol>
          )}

          <section className="card space-y-4 p-5">
            <h2 className="font-semibold">Que faire maintenant ?</h2>

            {booking.status === "pending" && isOwner && (
              <>
                <p className="text-sm text-muted">
                  {firstName(other.name)} souhaite louer votre matériel. Répondez avant le {formatDateTime(booking.expiresAt)}, sinon la demande expirera.
                  {" "}Une question ? <Link href={`/messages/${conversationId}`} className="font-medium text-brand-600 underline">Écrivez-lui</Link>.
                </p>
                <RespondForm bookingId={booking.id} />
              </>
            )}
            {booking.status === "pending" && !isOwner && (
              <>
                <p className="text-sm text-muted">
                  En attente de la réponse de {firstName(other.name)} (au plus tard le {formatDateTime(booking.expiresAt)}).
                </p>
                <CancelForm bookingId={booking.id} label="Annuler ma demande" />
              </>
            )}

            {booking.status === "accepted" && !paid && !isOwner && (
              <>
                <p className="text-sm">
                  {firstName(other.name)} a accepté ! Réglez la location pour confirmer la réservation avant le {formatDateTime(booking.expiresAt)}.
                </p>
                <PayButton bookingId={booking.id} amount={formatEuros(total)} />
              </>
            )}
            {booking.status === "accepted" && !paid && isOwner && (
              <p className="text-sm text-muted">Vous avez accepté. Le locataire doit maintenant payer en ligne pour confirmer.</p>
            )}

            {booking.status === "accepted" && paid && (
              <>
                <p className="text-sm">
                  {isOwner
                    ? `Convenez avec ${firstName(other.name)} du lieu et de l'heure de remise. Le jour J, vérifiez le matériel ensemble${online ? "" : ", encaissez la location"}${booking.deposit > 0 ? " et prenez la caution" : ""}.`
                    : `C'est confirmé ! Convenez avec ${firstName(other.name)} du lieu et de l'heure de remise.${online ? "" : ` Prévoyez ${formatEuros(total)} à régler sur place`}${booking.deposit > 0 ? `${online ? " Prévoyez" : " et"} une caution de ${formatEuros(booking.deposit)}` : ""}.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/messages/${conversationId}`} className="btn-secondary">💬 Messagerie</Link>
                  <Link href={`/reservations/${booking.id}/contrat`} className="btn-secondary">📄 Contrat de location</Link>
                </div>
                {!isOwner && booking.handoverCode && (
                  <div className="rounded-xl bg-sun-100 p-4 text-center" data-testid="handover-code">
                    <p className="text-sm font-medium">Votre code de remise</p>
                    <p className="mt-1 text-4xl font-extrabold tracking-[0.3em]" aria-label={`Code ${booking.handoverCode.split("").join(" ")}`}>
                      {booking.handoverCode}
                    </p>
                    <p className="mt-1 text-xs text-muted">Montrez-le à {firstName(other.name)} quand vous récupérez le matériel, pas avant.</p>
                  </div>
                )}
                {isOwner && today >= addDays(booking.startDate, -1) && <HandoverForm bookingId={booking.id} onsite={!online} />}
                {isOwner && today < addDays(booking.startDate, -1) && (
                  <p className="text-xs text-muted">Le jour de la remise, demandez au locataire son code à 4 chiffres pour confirmer.</p>
                )}
                {(isOwner || today < booking.startDate) && <CancelForm bookingId={booking.id} />}
              </>
            )}

            {booking.status === "ongoing" && (
              <>
                <p className="text-sm">
                  Location en cours. Retour prévu le <strong>{formatDate(booking.endDate, { weekday: "long" })}</strong>.
                  {isOwner ? " Une fois le matériel rendu et vérifié, confirmez le retour." : " Rendez le matériel propre et en bon état pour récupérer votre caution."}
                </p>
                {isOwner && <ReturnButton bookingId={booking.id} />}
                <Link href={`/reservations/${booking.id}/contrat`} className="btn-secondary">📄 Contrat de location</Link>
              </>
            )}

            {booking.status === "completed" && (
              <>
                <p className="text-sm">Location terminée le {booking.returnedAt ? formatDateTime(booking.returnedAt) : ""}. Merci d&apos;avoir utilisé Zouti !</p>
                {myReview ? (
                  <Alert tone="success">Vous avez laissé {myReview.rating} ★ : « {myReview.comment} »</Alert>
                ) : canReview(booking, reviews, user.id) ? (
                  <ReviewForm bookingId={booking.id} targetName={firstName(other.name)} />
                ) : null}
                {theirReview && (
                  <div className="rounded-xl bg-sand p-3 text-sm">
                    <p className="font-semibold">{firstName(other.name)} vous a laissé {theirReview.rating} ★</p>
                    <p className="mt-1">« {theirReview.comment} »</p>
                  </div>
                )}
              </>
            )}

            {booking.status === "declined" && (
              <p className="text-sm text-muted">
                Demande refusée{booking.cancelReason ? ` : « ${booking.cancelReason} »` : "."}{" "}
                {!isOwner && <Link href="/recherche" className="font-medium text-brand-600 underline">Trouver un autre matériel</Link>}
              </p>
            )}
            {booking.status === "cancelled" && (
              <p className="text-sm text-muted">
                Annulée par {booking.cancelledBy === "owner" ? "le propriétaire" : "le locataire"}
                {booking.cancelReason ? ` : « ${booking.cancelReason} »` : "."}
                {booking.paymentStatus === "refunded" && " Le paiement a été intégralement remboursé."}
              </p>
            )}
            {booking.status === "expired" && (
              <p className="text-sm text-muted">
                Cette demande a expiré faute de {booking.respondedAt ? "paiement" : "réponse"} dans les délais.{" "}
                {!isOwner && <Link href={`/annonces/${listing.id}`} className="font-medium text-brand-600 underline">Refaire une demande</Link>}
              </p>
            )}
          </section>

          {(photos.length > 0 || photoStages.length > 0) && (
            <section className="card space-y-4 p-5" aria-labelledby="etat-des-lieux">
              <div>
                <h2 id="etat-des-lieux" className="font-semibold">📸 État des lieux en photos</h2>
                <p className="text-sm text-muted">
                  Photographiez le matériel ensemble à la remise et au retour : en cas de désaccord, ces photos datées font foi.
                </p>
              </div>
              {(["handover", "return"] as const).map((stage) => {
                const list = photos.filter((p) => p.stage === stage);
                if (list.length === 0) return null;
                return (
                  <div key={stage}>
                    <h3 className="text-sm font-semibold first-letter:uppercase">{STAGE_LABELS[stage]} ({list.length})</h3>
                    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4" data-testid={`photos-${stage}`}>
                      {list.map((p) => (
                        <li key={p.imageId}>
                          <a href={imageUrl(p.imageId)} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg bg-line">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl(p.imageId, "thumb")} alt={`Photo ${STAGE_LABELS[stage]} par ${p.authorName ?? "un membre"}`} className="size-full object-cover" />
                          </a>
                          <p className="mt-0.5 truncate text-[11px] text-muted">
                            {p.authorId === user.id ? "Vous" : firstName(p.authorName ?? "Membre")} · {formatDateTime(p.createdAt)}
                          </p>
                          {p.note && <p className="truncate text-[11px]">{p.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {photoStages.length > 0 && <BookingPhotosForm bookingId={booking.id} stages={photoStages} max={MAX_PHOTOS_PER_STAGE} />}
            </section>
          )}

          {confirmed && listing.pickupNotes && (
            <section className="card p-5">
              <h2 className="font-semibold">Infos de retrait</h2>
              <p className="mt-1 whitespace-pre-line text-sm">{listing.pickupNotes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-muted uppercase">{isOwner ? "Locataire" : "Propriétaire"}</p>
            <Link href={`/profil/${other.id}`} className="mt-2 flex items-center gap-3 hover:opacity-90">
              <Avatar name={other.name} imageId={other.avatarImageId} size={44} />
              <div>
                <p className="font-semibold">{confirmed ? other.name : publicName(other.name)}</p>
                <p className="text-sm text-muted">{communeName(other.commune)}</p>
              </div>
            </Link>
            <div className="mt-4 space-y-2">
              <Link href={`/messages/${conversationId}`} className="btn-secondary w-full">💬 Envoyer un message</Link>
              {confirmed && wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn-secondary w-full">🟢 WhatsApp</a>
              )}
              {confirmed && other.phone && (
                <a href={`tel:${other.phone}`} className="btn-secondary w-full">📞 {other.phone}</a>
              )}
            </div>
            {!confirmed && <p className="mt-3 text-xs text-muted">Les coordonnées sont partagées une fois la réservation confirmée.</p>}
          </div>

          <div className="card p-5 text-sm">
            <h2 className="font-semibold">Récapitulatif</h2>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between">
                <dt>Location ({booking.days} j)</dt>
                <dd>{formatEuros(booking.rentalAmount)}</dd>
              </div>
              {booking.serviceFee > 0 && (
                <div className="flex justify-between">
                  <dt>Frais de service</dt>
                  <dd>{formatEuros(booking.serviceFee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                <dt>Total</dt>
                <dd>{formatEuros(total)}</dd>
              </div>
              {booking.deposit > 0 && (
                <div className="flex justify-between text-muted">
                  <dt>Caution</dt>
                  <dd>{formatEuros(booking.deposit)}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <dt>Paiement</dt>
                <dd>
                  {online
                    ? booking.paymentStatus === "paid"
                      ? "Payé en ligne ✓"
                      : booking.paymentStatus === "refunded"
                        ? "Remboursé"
                        : "En ligne"
                    : "Sur place"}
                </dd>
              </div>
            </dl>
            {isOwner && booking.serviceFee > 0 && (
              <p className="mt-3 text-xs text-muted">Vous recevez {formatEuros(booking.rentalAmount)} (hors frais de service).</p>
            )}
          </div>
          <p className="text-xs text-muted">Réservation n° {booking.id} · créée le {formatDateTime(booking.createdAt)}</p>
        </aside>
      </div>
    </div>
  );
}

-- Zouti : migration prévue (0001) par /replica-architect, à appliquer après drizzle/0000_init.sql.
-- Le schéma de base (14 tables) est dans drizzle/0000_init.sql et src/lib/db/schema.ts.
-- Ce fichier est un plan vérifié : il s'exécute sans erreur sur une base issue de 0000_init.sql,
-- mais il n'est pas encore branché sur Drizzle. /replica-build le transformera en vraie migration.

begin;

-- 1. Contraintes que l'application vérifie déjà, désormais garanties aussi par la base --------------

alter table bookings
  add constraint bookings_status_check
    check (status in ('pending','accepted','ongoing','completed','declined','cancelled','expired')),
  add constraint bookings_payment_status_check
    check (payment_status in ('none','pending','paid','refunded')),
  add constraint bookings_payment_method_check
    check (payment_method in ('onsite','online')),
  add constraint bookings_dates_check check (end_date >= start_date),
  add constraint bookings_amounts_check
    check (day_price > 0 and rental_amount >= 0 and service_fee >= 0 and deposit >= 0);

alter table listings
  add constraint listings_status_check check (status in ('active','paused','hidden','deleted')),
  add constraint listings_prices_check
    check (day_price > 0 and (week_price is null or week_price > 0) and deposit >= 0 and min_days >= 1);

alter table reviews add constraint reviews_rating_check check (rating between 1 and 5);
alter table blocked_periods add constraint blocked_periods_dates_check check (end_date >= start_date);
alter table users add constraint users_role_check check (role in ('user','admin'));

-- 2. Double réservation impossible au niveau de la base ----------------------------------------
-- Aujourd'hui : verrou sur l'annonce + vérification dans respondToBooking (src/lib/services/bookings.ts).
-- Ici : deux réservations confirmées ou en cours ne peuvent pas se chevaucher sur la même annonce.
create extension if not exists btree_gist;
alter table bookings
  add constraint bookings_no_overlap
  exclude using gist (
    listing_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('accepted','ongoing'));
-- Ajouté après /replica-test (BUG-006, drizzle/0003) : une seule demande en attente par
-- locataire et par période sur une annonce, même envoyée depuis deux onglets.
alter table bookings
  add constraint bookings_one_pending_per_renter
  exclude using gist (
    listing_id with =,
    renter_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status = 'pending');

-- 3. updated_at sur les tables qui changent ----------------------------------------------------
alter table bookings add column updated_at timestamptz not null default now();
alter table users add column updated_at timestamptz not null default now();
alter table conversations add column updated_at timestamptz not null default now();

-- 4. Correctifs replica-entrepreneur -----------------------------------------------------------

-- Fix 1 : état des lieux en photos (remise et retour), par l'une ou l'autre partie.
create table booking_photos (
  booking_id text not null references bookings(id) on delete cascade,
  image_id text not null references images(id) on delete cascade,
  author_id text references users(id) on delete set null,
  stage text not null check (stage in ('handover','return')),
  note text,
  created_at timestamptz not null default now(),
  primary key (booking_id, image_id)
);
create index booking_photos_booking_idx on booking_photos (booking_id, stage);

-- Fix 2 : relance du loueur avant expiration, et temps de réponse mesuré.
alter table bookings add column reminder_sent_at timestamptz;
create index bookings_pending_expiry_idx on bookings (expires_at) where status = 'pending';
-- Temps de réponse : responded_at - created_at, déjà stockés ; agrégé à la lecture (pas de colonne dérivée).

-- Fixes 5 et 6 : heure de remise et de retour, délai minimum avant réservation.
alter table bookings add column pickup_time time, add column return_time time;
alter table listings add column min_notice_days smallint not null default 0
  check (min_notice_days between 0 and 14);

-- Parité Bricolib : confirmation de remise par code (le locataire le montre, le loueur le saisit).
alter table bookings add column handover_code_hash text;

commit;

-- Contraintes garanties par la base (voir replica/architecture.md, « Écarts avec les règles du skill »).
-- Les énumérations Drizzle ne créent pas de CHECK : on les ajoute ici.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" CHECK ("status" IN ('pending','accepted','ongoing','completed','declined','cancelled','expired'));--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_status_check" CHECK ("payment_status" IN ('none','authorized','pending','paid','refunded'));--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_method_check" CHECK ("payment_method" IN ('onsite','online'));--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dates_check" CHECK ("end_date" >= "start_date");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_amounts_check" CHECK ("day_price" > 0 AND "rental_amount" >= 0 AND "service_fee" >= 0 AND "deposit" >= 0);--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_status_check" CHECK ("status" IN ('active','paused','hidden','deleted'));--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_prices_check" CHECK ("day_price" > 0 AND ("week_price" IS NULL OR "week_price" > 0) AND "deposit" >= 0 AND "min_days" >= 1 AND "min_notice_days" BETWEEN 0 AND 14);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE "blocked_periods" ADD CONSTRAINT "blocked_periods_dates_check" CHECK ("end_date" >= "start_date");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('user','admin'));--> statement-breakpoint
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_stage_check" CHECK ("stage" IN ('handover','return'));--> statement-breakpoint
-- Deux réservations acceptées ou en cours ne peuvent pas se chevaucher sur la même annonce.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING gist ("listing_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&) WHERE ("status" IN ('accepted','ongoing'));

-- Un locataire ne peut pas avoir deux demandes en attente qui se chevauchent sur la même annonce
-- (deux onglets envoyés au même instant, BUG-006).
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_one_pending_per_renter" EXCLUDE USING gist ("listing_id" WITH =, "renter_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&) WHERE ("status" = 'pending');

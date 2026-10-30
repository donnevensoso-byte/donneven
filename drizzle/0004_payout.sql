ALTER TABLE "bookings" ADD COLUMN "payout_transfer_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "paid_out_at" timestamp with time zone;
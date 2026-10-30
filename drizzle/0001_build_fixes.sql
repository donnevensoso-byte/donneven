CREATE TABLE "booking_photos" (
	"booking_id" text NOT NULL,
	"image_id" text NOT NULL,
	"author_id" text,
	"stage" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_photos_booking_id_image_id_pk" PRIMARY KEY("booking_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "handover_code" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "pickup_time" time;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "return_time" time;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "min_notice_days" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_photos_booking_idx" ON "booking_photos" USING btree ("booking_id","stage");--> statement-breakpoint
CREATE INDEX "bookings_pending_expiry_idx" ON "bookings" USING btree ("expires_at") WHERE "bookings"."status" = 'pending';
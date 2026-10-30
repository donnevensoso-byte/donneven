import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    commune: text("commune").notNull(),
    bio: text("bio"),
    avatarImageId: text("avatar_image_id"),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    stripeAccountId: text("stripe_account_id"),
    stripeOnboarded: boolean("stripe_onboarded").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // SHA-256 du jeton envoyé dans le cookie
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const emailTokens = pgTable("email_tokens", {
  id: text("id").primaryKey(), // SHA-256 du jeton envoyé par e-mail
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["verify", "reset"] }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const images = pgTable("images", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  data: bytea("data").notNull(),
  thumb: bytea("thumb").notNull(),
  createdAt: createdAt(),
});

export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    brand: text("brand"),
    condition: text("condition").notNull(),
    dayPrice: integer("day_price").notNull(), // centimes
    weekPrice: integer("week_price"), // centimes, facultatif (tarif dégressif)
    deposit: integer("deposit").notNull().default(0), // centimes
    minDays: smallint("min_days").notNull().default(1),
    // Délai minimum entre la demande et le début de la location (en jours).
    minNoticeDays: smallint("min_notice_days").notNull().default(0),
    commune: text("commune").notNull(),
    neighborhood: text("neighborhood"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    delivery: boolean("delivery").notNull().default(false),
    pickupNotes: text("pickup_notes"),
    // Titre, marque et description sans accents ni majuscules, pour la recherche
    searchText: text("search_text").notNull().default(""),
    status: text("status", { enum: ["active", "paused", "hidden", "deleted"] }).notNull().default("active"),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("listings_status_idx").on(t.status, t.createdAt),
    index("listings_owner_idx").on(t.ownerId),
    index("listings_category_idx").on(t.category),
    index("listings_commune_idx").on(t.commune),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.listingId, t.imageId] })],
);

export const blockedPeriods = pgTable(
  "blocked_periods",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("blocked_periods_listing_idx").on(t.listingId)],
);

export const BOOKING_STATUSES = [
  "pending", // demande envoyée, en attente de réponse du propriétaire
  "accepted", // acceptée (et payée si paiement en ligne)
  "ongoing", // matériel remis au locataire
  "completed", // matériel rendu
  "declined",
  "cancelled",
  "expired",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    renterId: text("renter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    days: smallint("days").notNull(),
    dayPrice: integer("day_price").notNull(),
    weekPrice: integer("week_price"),
    rentalAmount: integer("rental_amount").notNull(),
    serviceFee: integer("service_fee").notNull().default(0),
    deposit: integer("deposit").notNull().default(0),
    status: text("status", { enum: BOOKING_STATUSES }).notNull().default("pending"),
    paymentMethod: text("payment_method", { enum: ["onsite", "online"] }).notNull().default("onsite"),
    paymentStatus: text("payment_status", { enum: ["none", "authorized", "pending", "paid", "refunded"] })
      .notNull()
      .default("none"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    cancelReason: text("cancel_reason"),
    cancelledBy: text("cancelled_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    // Versement au propriétaire, fait à la remise (code du locataire).
    payoutTransferId: text("payout_transfer_id"),
    paidOutAt: timestamp("paid_out_at", { withTimezone: true }),
    handedOverAt: timestamp("handed_over_at", { withTimezone: true }),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    // Code à 4 chiffres que le locataire montre à la remise ; le propriétaire le saisit.
    handoverCode: text("handover_code"),
    // Relance envoyée au propriétaire avant l'expiration d'une demande.
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    pickupTime: time("pickup_time"),
    returnTime: time("return_time"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_listing_idx").on(t.listingId, t.status),
    index("bookings_renter_idx").on(t.renterId),
    index("bookings_owner_idx").on(t.ownerId),
    index("bookings_pending_expiry_idx").on(t.expiresAt).where(sql`${t.status} = 'pending'`),
  ],
);

export const PHOTO_STAGES = ["handover", "return"] as const;
export type PhotoStage = (typeof PHOTO_STAGES)[number];

/** État des lieux : photos datées prises à la remise et au retour du matériel. */
export const bookingPhotos = pgTable(
  "booking_photos",
  {
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    stage: text("stage", { enum: PHOTO_STAGES }).notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.imageId] }), index("booking_photos_booking_idx").on(t.bookingId, t.stage)],
);

/** Événements Stripe déjà traités (les webhooks peuvent arriver plusieurs fois). */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  createdAt: createdAt(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    renterId: text("renter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    renterLastReadAt: timestamp("renter_last_read_at", { withTimezone: true }),
    ownerLastReadAt: timestamp("owner_last_read_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("conversations_pair_idx").on(t.listingId, t.renterId),
    index("conversations_renter_idx").on(t.renterId, t.lastMessageAt),
    index("conversations_owner_idx").on(t.ownerId, t.lastMessageAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    // null pour les messages automatiques (événements de réservation)
    senderId: text("sender_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: text("target_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["renter", "owner"] }).notNull(), // rôle de l'auteur
    rating: smallint("rating").notNull(),
    comment: text("comment").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reviews_booking_author_idx").on(t.bookingId, t.authorId),
    index("reviews_target_idx").on(t.targetId),
    index("reviews_listing_idx").on(t.listingId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.listingId] })],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listingId: text("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status", { enum: ["open", "resolved"] }).notNull().default("open"),
  createdAt: createdAt(),
});

export const listingsRelations = relations(listings, ({ one, many }) => ({
  owner: one(users, { fields: [listings.ownerId], references: [users.id] }),
  images: many(listingImages),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;

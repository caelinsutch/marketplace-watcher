import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Users table - integrates with Supabase Auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Monitors table
export const monitors = pgTable("monitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  query: text("query"),
  photoUrl: text("photo_url"), // IGNORE THIS FOR NOW
  areaId: varchar("area_id", { length: 100 }).notNull(),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  condition: varchar("condition", { length: 20 }), // 'new', 'used', 'any'
  checkFrequency: varchar("check_frequency", { length: 20 })
    .notNull()
    .default("daily"), // 'hourly', 'daily', 'weekly'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Listings table
export const listings = pgTable("listings", {
  id: varchar("id", { length: 255 }).primaryKey(), // Facebook Marketplace ID
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  condition: varchar("condition", { length: 20 }),
  location: text("location"),

  // Price comparison fields
  strikeThroughPrice: decimal("strike_through_price", {
    precision: 10,
    scale: 2,
  }),
  comparablePrice: decimal("comparable_price", { precision: 10, scale: 2 }),
  comparablePriceType: varchar("comparable_price_type", { length: 50 }),

  // Status flags
  isHidden: boolean("is_hidden").notNull().default(false),
  isLive: boolean("is_live").notNull().default(true),
  isPending: boolean("is_pending").notNull().default(false),
  isSold: boolean("is_sold").notNull().default(false),

  // Category and delivery
  categoryId: varchar("category_id", { length: 100 }),
  deliveryTypes: jsonb("delivery_types")
    .$type<string[]>()
    .notNull()
    .default([]),

  // Location details
  locationDetails: jsonb("location_details").$type<{
    city?: string;
    state?: string;
    cityPageId?: string;
    cityDisplayName?: string;
  }>(),

  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  primaryPhotoUrl: text("primary_photo_url"),
  sellerInfo: jsonb("seller_info").$type<{
    name?: string;
    id?: string;
    profileUrl?: string;
  }>(),
  marketplaceUrl: text("marketplace_url").notNull(),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

// Listing price history table
export const listingPriceHistory = pgTable("listing_price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: varchar("listing_id", { length: 255 })
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Monitor matches table
export const monitorMatches = pgTable("monitor_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id", { length: 255 })
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  matchedAt: timestamp("matched_at").defaultNow().notNull(),
  isNotified: boolean("is_notified").notNull().default(false),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Notification type and trigger
  type: varchar("type", { length: 50 }).notNull(), // 'new_matches', 'price_drop', 'back_in_stock', 'daily_digest', etc.
  monitorId: uuid("monitor_id").references(() => monitors.id, {
    onDelete: "set null",
  }), // Optional: which monitor triggered this

  // Notification content
  title: text("title").notNull(),
  message: text("message").notNull(),

  // Delivery information
  deliveryMethod: varchar("delivery_method", { length: 20 }).notNull(), // 'email', 'push', 'sms', etc.
  deliveryStatus: varchar("delivery_status", { length: 20 })
    .notNull()
    .default("pending"), // 'pending', 'sent', 'failed', 'delivered'
  deliveryMetadata: jsonb("delivery_metadata").$type<{
    email?: string;
    phoneNumber?: string;
    deviceToken?: string;
    errorMessage?: string;
    deliveredAt?: string;
  }>(),

  // Timestamps
  scheduledFor: timestamp("scheduled_for"), // For scheduled notifications
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification listings junction table
export const notificationListings = pgTable("notification_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationId: uuid("notification_id")
    .notNull()
    .references(() => notifications.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id", { length: 255 })
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),

  // Additional context for this listing in the notification
  reason: varchar("reason", { length: 50 }), // 'new_match', 'price_dropped', 'back_in_stock', 'new_listing', etc.
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }), // For price drop notifications
  matchScore: decimal("match_score", { precision: 5, scale: 2 }), // Relevance score if applicable

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  monitors: many(monitors),
  notifications: many(notifications),
}));

export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  user: one(users, {
    fields: [monitors.userId],
    references: [users.id],
  }),
  matches: many(monitorMatches),
  notifications: many(notifications),
}));

export const listingsRelations = relations(listings, ({ many }) => ({
  priceHistory: many(listingPriceHistory),
  matches: many(monitorMatches),
  notificationListings: many(notificationListings),
}));

export const listingPriceHistoryRelations = relations(
  listingPriceHistory,
  ({ one }) => ({
    listing: one(listings, {
      fields: [listingPriceHistory.listingId],
      references: [listings.id],
    }),
  }),
);

export const monitorMatchesRelations = relations(monitorMatches, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorMatches.monitorId],
    references: [monitors.id],
  }),
  listing: one(listings, {
    fields: [monitorMatches.listingId],
    references: [listings.id],
  }),
}));

export const notificationsRelations = relations(
  notifications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [notifications.userId],
      references: [users.id],
    }),
    monitor: one(monitors, {
      fields: [notifications.monitorId],
      references: [monitors.id],
    }),
    notificationListings: many(notificationListings),
  }),
);

export const notificationListingsRelations = relations(
  notificationListings,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationListings.notificationId],
      references: [notifications.id],
    }),
    listing: one(listings, {
      fields: [notificationListings.listingId],
      references: [listings.id],
    }),
  }),
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Monitor = typeof monitors.$inferSelect;
export type NewMonitor = typeof monitors.$inferInsert;

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

export type ListingPriceHistory = typeof listingPriceHistory.$inferSelect;
export type NewListingPriceHistory = typeof listingPriceHistory.$inferInsert;

export type MonitorMatch = typeof monitorMatches.$inferSelect;
export type NewMonitorMatch = typeof monitorMatches.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type NotificationListing = typeof notificationListings.$inferSelect;
export type NewNotificationListing = typeof notificationListings.$inferInsert;

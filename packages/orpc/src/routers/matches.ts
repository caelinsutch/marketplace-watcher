import {
  db,
  listingPriceHistory,
  listings,
  monitorMatches,
  monitors,
} from "@marketplace-watcher/db";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { base } from "./base";

export const matchesRouter = {
  getByMonitor: base
    .input(
      z.object({
        monitorId: z.string().uuid(),
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        onlyUnread: z.boolean().optional(),
        sortBy: z.enum(["date", "price"]).optional().default("date"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
    )
    .handler(async ({ input, errors }) => {
      // First verify the monitor belongs to the user
      const [monitor] = await db
        .select()
        .from(monitors)
        .where(
          and(
            eq(monitors.id, input.monitorId),
            eq(monitors.userId, input.userId),
          ),
        );

      if (!monitor) {
        throw errors.NOT_FOUND({ message: "Monitor not found" });
      }

      // Build where conditions
      const whereConditions = [eq(monitorMatches.monitorId, input.monitorId)];
      if (input.onlyUnread) {
        whereConditions.push(eq(monitorMatches.isNotified, false));
      }

      // Get matches with listings
      const query = db
        .select({
          id: monitorMatches.id,
          matchedAt: monitorMatches.matchedAt,
          isNotified: monitorMatches.isNotified,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            location: listings.location,
            locationDetails: listings.locationDetails,
            photos: listings.photos,
            primaryPhotoUrl: listings.primaryPhotoUrl,
            marketplaceUrl: listings.marketplaceUrl,
            firstSeenAt: listings.firstSeenAt,
            lastSeenAt: listings.lastSeenAt,
          },
        })
        .from(monitorMatches)
        .innerJoin(listings, eq(monitorMatches.listingId, listings.id))
        .where(and(...whereConditions));

      // Apply sorting
      if (input.sortBy === "price") {
        query.orderBy(
          input.sortOrder === "desc"
            ? desc(listings.price)
            : asc(listings.price),
        );
      } else {
        query.orderBy(
          input.sortOrder === "desc"
            ? desc(monitorMatches.matchedAt)
            : asc(monitorMatches.matchedAt),
        );
      }

      const matches = await query.limit(input.limit).offset(input.offset);

      // Get price history for each listing
      const listingIds = matches.map((m) => m.listing.id);
      const priceHistories = await db
        .select({
          listingId: listingPriceHistory.listingId,
          price: listingPriceHistory.price,
          recordedAt: listingPriceHistory.recordedAt,
        })
        .from(listingPriceHistory)
        .where(
          listingIds.length > 0
            ? inArray(listingPriceHistory.listingId, listingIds)
            : sql`false`,
        )
        .orderBy(desc(listingPriceHistory.recordedAt));

      // Group price histories by listing
      const priceHistoryMap = priceHistories.reduce<
        Record<string, Array<{ price: string; recordedAt: Date }>>
      >((acc, history) => {
        if (!acc[history.listingId]) {
          acc[history.listingId] = [];
        }
        acc[history.listingId]?.push({
          price: history.price,
          recordedAt: history.recordedAt,
        });
        return acc;
      }, {});

      // Add price history to matches
      const matchesWithPriceHistory = matches.map((match) => ({
        ...match,
        priceHistory: priceHistoryMap[match.listing.id] || [],
      }));

      return matchesWithPriceHistory;
    }),

  markNotified: base
    .input(
      z.object({
        matchId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      // Verify the match belongs to a monitor owned by the user
      const [match] = await db
        .select({
          id: monitorMatches.id,
          monitor: {
            userId: monitors.userId,
          },
        })
        .from(monitorMatches)
        .innerJoin(monitors, eq(monitorMatches.monitorId, monitors.id))
        .where(eq(monitorMatches.id, input.matchId));

      if (!match || match.monitor.userId !== input.userId) {
        throw errors.NOT_FOUND({ message: "Match not found" });
      }

      const [updated] = await db
        .update(monitorMatches)
        .set({ isNotified: true })
        .where(eq(monitorMatches.id, input.matchId))
        .returning();

      return updated;
    }),

  getStats: base
    .input(
      z.object({
        monitorId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      // Verify monitor ownership
      const [monitor] = await db
        .select()
        .from(monitors)
        .where(
          and(
            eq(monitors.id, input.monitorId),
            eq(monitors.userId, input.userId),
          ),
        );

      if (!monitor) {
        throw errors.NOT_FOUND({ message: "Monitor not found" });
      }

      // Get match counts
      const totalMatches = await db
        .select({ count: count() })
        .from(monitorMatches)
        .where(eq(monitorMatches.monitorId, input.monitorId));

      const unnotifiedMatches = await db
        .select({ count: count() })
        .from(monitorMatches)
        .where(
          and(
            eq(monitorMatches.monitorId, input.monitorId),
            eq(monitorMatches.isNotified, false),
          ),
        );

      return {
        totalMatches: totalMatches[0]?.count || 0,
        unnotifiedMatches: unnotifiedMatches[0]?.count || 0,
      };
    }),

  markAllNotified: base
    .input(
      z.object({
        monitorId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      // Verify monitor ownership
      const [monitor] = await db
        .select()
        .from(monitors)
        .where(
          and(
            eq(monitors.id, input.monitorId),
            eq(monitors.userId, input.userId),
          ),
        );

      if (!monitor) {
        throw errors.NOT_FOUND({ message: "Monitor not found" });
      }

      // Update all unnotified matches for this monitor
      const updated = await db
        .update(monitorMatches)
        .set({ isNotified: true })
        .where(
          and(
            eq(monitorMatches.monitorId, input.monitorId),
            eq(monitorMatches.isNotified, false),
          ),
        )
        .returning();

      return { count: updated.length };
    }),
};

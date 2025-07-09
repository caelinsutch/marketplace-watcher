import {
  db,
  listings,
  monitorMatches,
  monitors,
} from "@marketplace-watcher/db";
import { and, count, desc, eq } from "drizzle-orm";
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

      // Get matches with listings
      const matches = await db
        .select({
          id: monitorMatches.id,
          matchedAt: monitorMatches.matchedAt,
          isNotified: monitorMatches.isNotified,
          listing: {
            id: listings.id,
            title: listings.title,
            description: listings.description,
            price: listings.price,
            condition: listings.condition,
            location: listings.location,
            photos: listings.photos,
            sellerInfo: listings.sellerInfo,
            marketplaceUrl: listings.marketplaceUrl,
            firstSeenAt: listings.firstSeenAt,
            lastSeenAt: listings.lastSeenAt,
          },
        })
        .from(monitorMatches)
        .innerJoin(listings, eq(monitorMatches.listingId, listings.id))
        .where(eq(monitorMatches.monitorId, input.monitorId))
        .orderBy(desc(monitorMatches.matchedAt))
        .limit(input.limit)
        .offset(input.offset);

      return matches;
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
};

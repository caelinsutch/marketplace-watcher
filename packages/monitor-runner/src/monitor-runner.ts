import {
  type MarketplaceListing,
  getMarketplaceListings,
} from "@marketplace-watcher/clients";
import {
  db,
  listingPriceHistory,
  listings,
  monitorMatches,
  monitors,
} from "@marketplace-watcher/db";
import { now } from "@marketplace-watcher/utils";
import { and, eq } from "drizzle-orm";

export type MonitorRunResult = {
  changedListingIds: string[];
  totalListingIds: string[];
  status: "success" | "error";
  error?: string;
};

export const runMonitor = async (
  monitorId: string,
): Promise<MonitorRunResult> => {
  try {
    // Get monitor details
    const [monitor] = await db
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitorId));

    if (!monitor) {
      return {
        changedListingIds: [],
        totalListingIds: [],
        status: "error",
        error: "Monitor not found",
      };
    }

    if (!monitor.isActive) {
      return {
        changedListingIds: [],
        totalListingIds: [],
        status: "error",
        error: "Monitor is not active",
      };
    }

    // Fetch listings from Facebook Marketplace
    const marketplaceListings = await getMarketplaceListings(monitor.url, 1);

    console.log(
      "marketplaceListings",
      JSON.stringify(marketplaceListings, null, 2),
    );

    if (!marketplaceListings || marketplaceListings.length === 0) {
      return {
        changedListingIds: [],
        totalListingIds: [],
        status: "success",
      };
    }

    const changedListingIds: string[] = [];
    const totalListingIds: string[] = [];

    // Process each listing
    for (const marketplaceListing of marketplaceListings) {
      const listingData = mapMarketplaceListingToDb(marketplaceListing);
      totalListingIds.push(listingData.id);

      // Check if listing already exists
      const [existingListing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingData.id));

      if (existingListing) {
        // Check if price has changed
        const currentPrice = listingData.price;
        const existingPrice = existingListing.price;

        if (currentPrice !== existingPrice) {
          // Update listing with new price
          await db
            .update(listings)
            .set({
              ...listingData,
              lastSeenAt: now(),
            })
            .where(eq(listings.id, listingData.id));

          // Add price history entry
          await db.insert(listingPriceHistory).values({
            listingId: listingData.id,
            price: listingData.price,
            recordedAt: now(),
          });

          changedListingIds.push(listingData.id);
        } else {
          // Update last seen timestamp
          await db
            .update(listings)
            .set({
              lastSeenAt: now(),
            })
            .where(eq(listings.id, listingData.id));
        }
      } else {
        // Insert new listing
        await db.insert(listings).values(listingData);

        // Add initial price history entry
        await db.insert(listingPriceHistory).values({
          listingId: listingData.id,
          price: listingData.price,
          recordedAt: now(),
        });

        changedListingIds.push(listingData.id);
      }

      // Check if monitor-listing match already exists
      const [existingMatch] = await db
        .select()
        .from(monitorMatches)
        .where(
          and(
            eq(monitorMatches.monitorId, monitorId),
            eq(monitorMatches.listingId, listingData.id),
          ),
        );

      if (!existingMatch) {
        // Create monitor match
        await db.insert(monitorMatches).values({
          monitorId,
          listingId: listingData.id,
          matchedAt: now(),
          isNotified: false,
        });
      }
    }

    return {
      changedListingIds,
      totalListingIds,
      status: "success",
    };
  } catch (error) {
    console.error("Error running monitor:", error);
    return {
      changedListingIds: [],
      totalListingIds: [],
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const mapMarketplaceListingToDb = (marketplaceListing: MarketplaceListing) => {
  // Parse price from cents string to integer
  const priceInCents = marketplaceListing.listing_price
    ?.amount_with_offset_in_currency
    ? Number.parseInt(
        marketplaceListing.listing_price.amount_with_offset_in_currency,
        10,
      )
    : 0;

  const location = marketplaceListing.location?.reverse_geocode;

  return {
    id: marketplaceListing.id,
    title: marketplaceListing.marketplace_listing_title || "",
    description: null,
    price: priceInCents,
    condition: null,
    location: location?.city || null,
    strikeThroughPrice: null,
    comparablePrice: null,
    comparablePriceType: null,
    isHidden: false,
    isLive: true,
    isPending: false,
    isSold: false,
    categoryId: null,
    deliveryTypes: [],
    locationDetails: location
      ? {
          city: location.city,
          state: location.state,
          cityPageId: location.city_page?.id,
          cityDisplayName: location.city_page?.display_name,
        }
      : null,
    photos: [],
    primaryPhotoUrl:
      marketplaceListing.primary_listing_photo?.photo_image_url || null,
    sellerInfo: null,
    marketplaceUrl:
      marketplaceListing.listingUrl || marketplaceListing.facebookUrl,
    firstSeenAt: now(),
    lastSeenAt: now(),
  };
};

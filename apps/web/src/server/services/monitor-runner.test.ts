import { db, listings, monitorMatches } from "@marketplace-watcher/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as facebookMarketplace from "../../clients/apify/facebook-marketplace";
import { runMonitor } from "./monitor-runner";

// Mock the database
vi.mock("@marketplace-watcher/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
  monitors: {},
  listings: {},
  listingPriceHistory: {},
  monitorMatches: {},
}));

// Mock the Facebook Marketplace client
vi.mock("../../clients/apify/facebook-marketplace", () => ({
  getMarketplaceListings: vi.fn(),
}));

describe("Monitor Runner Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockMonitor = {
    id: "monitor-123",
    userId: "user-123",
    name: "Test Monitor",
    url: "https://facebook.com/marketplace/test",
    isActive: true,
    checkFrequency: "daily",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMarketplaceListing = {
    id: "listing-123",
    facebookUrl: "https://facebook.com/marketplace/item/123",
    listingUrl: "https://facebook.com/marketplace/item/123",
    marketplace_listing_title: "Test Item",
    listing_price: {
      formatted_amount: "$100",
      amount_with_offset_in_currency: "100",
      amount: "100",
    },
    primary_listing_photo: {
      id: "photo-123",
      photo_image_url: "https://example.com/photo.jpg",
      __typename: "Photo",
    },
    location: {
      reverse_geocode: {
        city: "New York",
        state: "NY",
        city_page: {
          display_name: "New York, NY",
          id: "city-123",
        },
      },
    },
  };

  describe("runMonitor", () => {
    it("should return error when monitor is not found", async () => {
      // Mock database to return no monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await runMonitor("nonexistent-monitor");

      expect(result).toEqual({
        changedListingIds: [],
        totalListingIds: [],
        status: "error",
        error: "Monitor not found",
      });
    });

    it("should return error when monitor is not active", async () => {
      // Mock database to return inactive monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([{ ...mockMonitor, isActive: false }]),
        }),
      });

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: [],
        totalListingIds: [],
        status: "error",
        error: "Monitor is not active",
      });
    });

    it("should return success with empty arrays when no listings found", async () => {
      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return no listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue(
        [],
      );

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: [],
        totalListingIds: [],
        status: "success",
      });
    });

    it("should handle new listings correctly", async () => {
      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue([
        mockMarketplaceListing,
      ]);

      // Mock database queries for listing existence (new listing)
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockMonitor]); // Monitor query
            if (callCount === 2) return Promise.resolve([]); // Listing doesn't exist
            if (callCount === 3) return Promise.resolve([]); // Monitor match doesn't exist
            return Promise.resolve([]);
          }),
        }),
      }));

      // Mock database inserts
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{}]),
        }),
      });

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: ["listing-123"],
        totalListingIds: ["listing-123"],
        status: "success",
      });

      // Verify that insert was called for listing and price history
      expect(db.insert).toHaveBeenCalledTimes(3); // listing, price history, monitor match
    });

    it("should handle price changes correctly", async () => {
      const existingListing = {
        id: "listing-123",
        title: "Test Item",
        price: "50", // Different price
        location: "New York",
        marketplaceUrl: "https://facebook.com/marketplace/item/123",
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };

      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue([
        mockMarketplaceListing,
      ]);

      // Mock database queries
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockMonitor]); // Monitor query
            if (callCount === 2) return Promise.resolve([existingListing]); // Listing exists with different price
            if (callCount === 3) return Promise.resolve([{}]); // Monitor match exists
            return Promise.resolve([]);
          }),
        }),
      }));

      // Mock database update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{}]),
        }),
      });

      // Mock database insert for price history
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue([{}]),
      });

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: ["listing-123"],
        totalListingIds: ["listing-123"],
        status: "success",
      });

      // Verify that update was called for listing and insert for price history
      expect(db.update).toHaveBeenCalledTimes(1);
      expect(db.insert).toHaveBeenCalledTimes(1); // price history
    });

    it("should handle existing listings with same price correctly", async () => {
      const existingListing = {
        id: "listing-123",
        title: "Test Item",
        price: "100", // Same price
        location: "New York",
        marketplaceUrl: "https://facebook.com/marketplace/item/123",
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };

      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue([
        mockMarketplaceListing,
      ]);

      // Mock database queries
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockMonitor]); // Monitor query
            if (callCount === 2) return Promise.resolve([existingListing]); // Listing exists with same price
            if (callCount === 3) return Promise.resolve([{}]); // Monitor match exists
            return Promise.resolve([]);
          }),
        }),
      }));

      // Mock database update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{}]),
        }),
      });

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: [],
        totalListingIds: ["listing-123"],
        status: "success",
      });

      // Verify that update was called only for lastSeenAt timestamp
      expect(db.update).toHaveBeenCalledTimes(1);
      expect(db.insert).not.toHaveBeenCalled(); // No price history entry
    });

    it("should handle multiple listings correctly", async () => {
      const mockListing2 = {
        ...mockMarketplaceListing,
        id: "listing-456",
        marketplace_listing_title: "Test Item 2",
        listing_price: {
          formatted_amount: "$200",
          amount_with_offset_in_currency: "200",
          amount: "200",
        },
      };

      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return multiple listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue([
        mockMarketplaceListing,
        mockListing2,
      ]);

      // Mock database queries (both listings are new)
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockMonitor]); // Monitor query
            return Promise.resolve([]); // All other queries return empty (new listings, no matches)
          }),
        }),
      }));

      // Mock database inserts
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{}]),
        }),
      });

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: ["listing-123", "listing-456"],
        totalListingIds: ["listing-123", "listing-456"],
        status: "success",
      });

      // Verify that insert was called for both listings (listing, price history, monitor match each)
      expect(db.insert).toHaveBeenCalledTimes(6); // 2 * (listing + price history + monitor match)
    });

    it("should handle errors gracefully", async () => {
      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to throw error
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockRejectedValue(
        new Error("Facebook API error"),
      );

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: [],
        totalListingIds: [],
        status: "error",
        error: "Facebook API error",
      });
    });

    it("should handle database errors gracefully", async () => {
      // Mock database to throw error
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockRejectedValue(new Error("Database connection error")),
        }),
      });

      const result = await runMonitor("monitor-123");

      expect(result).toEqual({
        changedListingIds: [],
        totalListingIds: [],
        status: "error",
        error: "Database connection error",
      });
    });

    it("should create monitor matches for new listings", async () => {
      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue([
        mockMarketplaceListing,
      ]);

      // Mock database queries for listing existence (new listing)
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockMonitor]); // Monitor query
            if (callCount === 2) return Promise.resolve([]); // Listing doesn't exist
            if (callCount === 3) return Promise.resolve([]); // Monitor match doesn't exist
            return Promise.resolve([]);
          }),
        }),
      }));

      // Mock database inserts
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{}]),
        }),
      });
      (db.insert as any).mockImplementation(mockInsert);

      await runMonitor("monitor-123");

      // Verify that monitor match was created
      expect(mockInsert).toHaveBeenCalledWith(monitorMatches);
    });
  });

  describe("mapMarketplaceListingToDb", () => {
    it("should map marketplace listing to database format correctly", async () => {
      // This test verifies the mapping logic indirectly through the main function
      // Mock database to return active monitor
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMonitor]),
        }),
      });

      // Mock Facebook Marketplace to return listings
      vi.mocked(facebookMarketplace.getMarketplaceListings).mockResolvedValue([
        mockMarketplaceListing,
      ]);

      // Mock database queries for listing existence (new listing)
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockMonitor]); // Monitor query
            return Promise.resolve([]); // All other queries return empty
          }),
        }),
      }));

      // Mock database inserts and capture the values
      let insertedListingData: any;
      (db.insert as any).mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((data: any) => {
          if (table === listings) {
            insertedListingData = data;
          }
          return {
            returning: vi.fn().mockResolvedValue([{}]),
          };
        }),
      }));

      await runMonitor("monitor-123");

      // Verify the mapping
      expect(insertedListingData).toMatchObject({
        id: "listing-123",
        title: "Test Item",
        price: "100",
        location: "New York",
        locationDetails: {
          city: "New York",
          state: "NY",
          cityPageId: "city-123",
          cityDisplayName: "New York, NY",
        },
        primaryPhotoUrl: "https://example.com/photo.jpg",
        marketplaceUrl: "https://facebook.com/marketplace/item/123",
        isHidden: false,
        isLive: true,
        isPending: false,
        isSold: false,
      });
    });
  });
});

export type Match = {
  id: string;
  matchedAt: Date;
  isNotified: boolean;
  listing: {
    id: string;
    title: string;
    price: string;
    location: string | null;
    locationDetails: {
      city?: string;
      state?: string;
      cityPageId?: string;
      cityDisplayName?: string;
    } | null;
    photos: string[];
    primaryPhotoUrl: string | null;
    marketplaceUrl: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
  };
  priceHistory: Array<{
    price: string;
    recordedAt: Date;
  }>;
};

export type Monitor = {
  id: string;
  name: string;
  url: string;
  checkFrequency: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SortBy = "date" | "price";
export type SortOrder = "asc" | "desc";

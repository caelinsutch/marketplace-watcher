// Re-export database types
export type {
  User,
  NewUser,
  Monitor,
  NewMonitor,
  Listing,
  NewListing,
  ListingPriceHistory,
  NewListingPriceHistory,
  MonitorMatch,
  NewMonitorMatch,
} from "db/src/schema";

// Enums
export enum MonitorCondition {
  NEW = "new",
  USED = "used",
  ANY = "any",
}

export enum CheckFrequency {
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
}

// API input types
export type CreateMonitorInput = {
  name: string;
  query?: string;
  photoUrl?: string;
  areaId: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: MonitorCondition;
  checkFrequency?: CheckFrequency;
};

export type UpdateMonitorInput = Partial<CreateMonitorInput> & {
  isActive?: boolean;
};

// Extended types with relations
export type MonitorWithMatches = Monitor & {
  matches: (MonitorMatch & {
    listing: Listing;
  })[];
};

export type ListingWithPriceHistory = Listing & {
  priceHistory: ListingPriceHistory[];
};

// Notification types
export type NotificationSettings = {
  userId: string;
  emailEnabled: boolean;
  emailFrequency: "instant" | "daily" | "weekly";
};

// Marketplace search types
export type MarketplaceSearchParams = {
  query?: string;
  areaId: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: MonitorCondition;
};

export type MarketplaceSearchResult = {
  listings: Listing[];
  hasMore: boolean;
  nextCursor?: string;
};

// API response types
export type ApiResponse<T> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: {
        message: string;
        code?: string;
      };
    };

export type ApiError = {
  message: string;
  code?: string;
  statusCode: number;
};

// Pagination types
export type PaginationParams = {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

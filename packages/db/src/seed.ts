import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  listingPriceHistory,
  listings,
  monitorMatches,
  monitors,
  users,
} from "./schema";

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a demo user in Supabase Auth first
  const demoUserId = "00000000-0000-0000-0000-000000000001";
  const demoEmail = "demo@marketplace-watcher.com";
  const demoPassword = "demo123456"; // Simple password for demo

  console.log("🔐 Creating demo user in Supabase Auth...");

  // Create the auth user with the specific UUID
  await sql`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, recovery_sent_at, last_sign_in_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) 
    VALUES (
      '00000000-0000-0000-0000-000000000000', 
      ${demoUserId}::uuid, 
      'authenticated', 
      'authenticated', 
      ${demoEmail}, 
      crypt(${demoPassword}, gen_salt('bf')), 
      current_timestamp, 
      current_timestamp, 
      current_timestamp, 
      '{"provider":"email","providers":["email"]}'::jsonb, 
      '{}'::jsonb, 
      current_timestamp, 
      current_timestamp, 
      '', '', '', ''
    )
    ON CONFLICT (id) DO NOTHING
  `;

  // Create the auth identity
  await sql`
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), 
      ${demoUserId}::uuid, 
      ${JSON.stringify({
        sub: demoUserId,
        email: demoEmail,
      })}::jsonb, 
      'email', 
      gen_random_uuid(), 
      current_timestamp, 
      current_timestamp, 
      current_timestamp
    )
    ON CONFLICT (provider, provider_id) DO NOTHING
  `;

  console.log("✅ Created demo user in Supabase Auth");

  // Create the application user record
  await db
    .insert(users)
    .values({
      id: demoUserId,
      email: demoEmail,
    })
    .onConflictDoNothing();

  console.log("✅ Created demo user in application database");

  // Create monitors
  const monitorsData = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      userId: demoUserId,
      name: "Vintage Furniture",
      url: "https://www.facebook.com/marketplace/nyc/search/?query=vintage%20furniture&maxPrice=500",
      checkFrequency: "hourly",
      isActive: true,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      userId: demoUserId,
      name: "MacBook Pro",
      url: "https://www.facebook.com/marketplace/sf-bay-area/search/?query=macbook%20pro&minPrice=800&maxPrice=2000",
      checkFrequency: "hourly",
      isActive: true,
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      userId: demoUserId,
      name: "Road Bikes",
      url: "https://www.facebook.com/marketplace/seattle/search/?query=road%20bike&maxPrice=1000",
      checkFrequency: "daily",
      isActive: true,
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      userId: demoUserId,
      name: "Gaming Console",
      url: "https://www.facebook.com/marketplace/los-angeles/search/?query=ps5%20xbox",
      checkFrequency: "daily",
      isActive: false,
    },
  ];

  await db.insert(monitors).values(monitorsData).onConflictDoNothing();
  console.log("✅ Created monitors");

  // Create listings with varied data
  const listingsData = [
    // Vintage Furniture listings
    {
      id: "fb_listing_1",
      title: "Beautiful Mid-Century Modern Dresser",
      price: "350.00",
      location: "Brooklyn, NY",
      locationDetails: { cityDisplayName: "Brooklyn", state: "NY" },
      photos: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/123456789",
      firstSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      lastSeenAt: new Date(),
    },
    {
      id: "fb_listing_2",
      title: "Antique Oak Dining Table Set",
      price: "450.00",
      location: "Manhattan, NY",
      locationDetails: { cityDisplayName: "Manhattan", state: "NY" },
      photos: [
        "https://images.unsplash.com/photo-1549497538-303791108f95?w=800",
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1549497538-303791108f95?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/223456789",
      firstSeenAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      lastSeenAt: new Date(),
    },
    {
      id: "fb_listing_3",
      title: "Retro Velvet Sofa - Must Go!",
      price: "275.00",
      location: "Queens, NY",
      locationDetails: { cityDisplayName: "Queens", state: "NY" },
      photos: [
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/323456789",
      firstSeenAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      lastSeenAt: new Date(),
    },

    // MacBook Pro listings
    {
      id: "fb_listing_4",
      title: 'MacBook Pro 16" M1 Max - Like New',
      price: "1800.00",
      location: "San Francisco, CA",
      locationDetails: { cityDisplayName: "San Francisco", state: "CA" },
      photos: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/423456789",
      firstSeenAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      lastSeenAt: new Date(),
    },
    {
      id: "fb_listing_5",
      title: 'MacBook Pro 14" M2 Pro 1TB',
      price: "1500.00",
      location: "Oakland, CA",
      locationDetails: { cityDisplayName: "Oakland", state: "CA" },
      photos: [
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/523456789",
      firstSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastSeenAt: new Date(),
    },

    // Road Bikes listings
    {
      id: "fb_listing_6",
      title: "Trek Domane SL5 Road Bike - 56cm",
      price: "850.00",
      location: "Seattle, WA",
      locationDetails: { cityDisplayName: "Seattle", state: "WA" },
      photos: [
        "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800",
        "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/623456789",
      firstSeenAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      lastSeenAt: new Date(),
    },
    {
      id: "fb_listing_7",
      title: "Specialized Allez Sport - Great Starter Bike",
      price: "600.00",
      location: "Bellevue, WA",
      locationDetails: { cityDisplayName: "Bellevue", state: "WA" },
      photos: [
        "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/723456789",
      firstSeenAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      lastSeenAt: new Date(),
    },

    // Gaming Console listings (for inactive monitor)
    {
      id: "fb_listing_8",
      title: "PS5 Bundle with Extra Controller",
      price: "550.00",
      location: "Los Angeles, CA",
      locationDetails: { cityDisplayName: "Los Angeles", state: "CA" },
      photos: [
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800",
      ],
      primaryPhotoUrl:
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800",
      marketplaceUrl: "https://www.facebook.com/marketplace/item/823456789",
      firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      lastSeenAt: new Date(),
    },
  ];

  await db.insert(listings).values(listingsData).onConflictDoNothing();
  console.log("✅ Created listings");

  // Create monitor matches
  const matchesData = [
    // Vintage Furniture matches
    {
      id: "00000000-0000-0000-0010-000000000001",
      monitorId: "00000000-0000-0000-0000-000000000001",
      listingId: "fb_listing_1",
      matchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isNotified: true,
    },
    {
      id: "00000000-0000-0000-0010-000000000002",
      monitorId: "00000000-0000-0000-0000-000000000001",
      listingId: "fb_listing_2",
      matchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isNotified: false,
    },
    {
      id: "00000000-0000-0000-0010-000000000003",
      monitorId: "00000000-0000-0000-0000-000000000001",
      listingId: "fb_listing_3",
      matchedAt: new Date(Date.now() - 30 * 60 * 1000),
      isNotified: false,
    },

    // MacBook Pro matches
    {
      id: "00000000-0000-0000-0010-000000000004",
      monitorId: "00000000-0000-0000-0000-000000000002",
      listingId: "fb_listing_4",
      matchedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isNotified: true,
    },
    {
      id: "00000000-0000-0000-0010-000000000005",
      monitorId: "00000000-0000-0000-0000-000000000002",
      listingId: "fb_listing_5",
      matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isNotified: true,
    },

    // Road Bikes matches
    {
      id: "00000000-0000-0000-0010-000000000006",
      monitorId: "00000000-0000-0000-0000-000000000003",
      listingId: "fb_listing_6",
      matchedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      isNotified: false,
    },
    {
      id: "00000000-0000-0000-0010-000000000007",
      monitorId: "00000000-0000-0000-0000-000000000003",
      listingId: "fb_listing_7",
      matchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isNotified: false,
    },

    // Gaming Console matches (for inactive monitor)
    {
      id: "00000000-0000-0000-0010-000000000008",
      monitorId: "00000000-0000-0000-0000-000000000004",
      listingId: "fb_listing_8",
      matchedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isNotified: true,
    },
  ];

  await db.insert(monitorMatches).values(matchesData).onConflictDoNothing();
  console.log("✅ Created monitor matches");

  // Create price history for some listings
  const priceHistoryData = [
    // MacBook Pro had a price drop
    {
      id: "00000000-0000-0000-0020-000000000001",
      listingId: "fb_listing_4",
      price: "2000.00",
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "00000000-0000-0000-0020-000000000002",
      listingId: "fb_listing_4",
      price: "1800.00",
      recordedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },

    // Vintage dresser price history
    {
      id: "00000000-0000-0000-0020-000000000003",
      listingId: "fb_listing_1",
      price: "400.00",
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "00000000-0000-0000-0020-000000000004",
      listingId: "fb_listing_1",
      price: "350.00",
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  await db
    .insert(listingPriceHistory)
    .values(priceHistoryData)
    .onConflictDoNothing();
  console.log("✅ Created price history");

  console.log("✨ Database seeded successfully!");
  console.log("\n📧 Demo user credentials:");
  console.log(`Email: ${demoEmail}`);
  console.log(`Password: ${demoPassword}`);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });

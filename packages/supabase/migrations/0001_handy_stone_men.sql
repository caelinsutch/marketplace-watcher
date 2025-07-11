ALTER TABLE "listing_price_history" ALTER COLUMN "price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "notification_listings" ALTER COLUMN "previous_price" SET DATA TYPE integer;
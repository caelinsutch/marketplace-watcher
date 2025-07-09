# Marketplace Watcher Implementation Plan

## 1. Frontend Pages & Components

### Dashboard (`/dashboard`)

- Monitor list with status indicators
- Quick stats (active monitors, recent matches)
- Create monitor button

### Monitor Management

- `/monitors/new` - Create monitor form
  - This should take in a monitor name, query, area id, optional min price / max price, and a check frequency
- `/monitors/[id]` - Monitor detail with matched listings
- `/monitors/[id]/edit` - Edit monitor form

### Components

- **MonitorCard** - Display monitor summary
- **ListingCard** - Display marketplace listing
- **MonitorForm** - Reusable form for create/edit
- **NotificationSettings** - Email preferences

## 2. Marketplace Integratoin
- Add an endpoint run on an hourly cron through Vercel that
  - Queries all monitors
  - If they're set to run, uses the Apify Facebook Marketplace scraper (https://apify.com/apify/facebook-marketplace-scraper) to fetch data, update the item information, price information and monitor matches relation for that search in the database
  - Send an email to the user with the summary using Resend and react email


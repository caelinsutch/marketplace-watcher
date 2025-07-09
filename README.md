# Marketplace Watcher

Get alerted when there's new marketplace listings in your region that fit a query, photo, or description.

## Getting Started

Ensure your `.env.local` is setup properly

```bash

# Start Supabase if you haven't already
supabase start

# Run the dev server
turbo dev

```

## Structure

### User authenticates with email

Users authenticate via Supabase Auth using email/password.

### User can create marketplace monitors

These are configurable with:
- Search query and/or photo
- Location (area_id) 
- Price range (min/max)
- Item condition (new/used/any)
- Check frequency

### Monitor Management

Users can:
- Edit existing monitors
- Delete monitors
- Pause/unpause monitors
- View monitor history and matched listings

### Cron using supabase pg_cron 

Run every hour, pull the relevant monitors, and query marketplace pulling in the item ids. Items are then enriched and stored in the db. Items are retained indefinitely as storage is cheap and each has a unique item id.

### Alerting

If there's "new" hits based on item ids, user is sent an email notification with:
- Links to the new listings
- Key details (price, condition, location)
- Photos of the items

### Dashboard

Simple web dashboard where users can:
- View all active monitors
- See recently matched listings
- Manage notification settings
- Create/edit/delete monitors

## Eng Notes

### Query Params

https://www.facebook.com/marketplace/[area_id]/search/?deliveryMethod=local_pick_up&query=[query]&exact=false&radius=[radius_km]

- area_id => Either a large metro area (i.e. nyc, sf, sac) or a unique ID internal to facebook
- query => Search term
- radius_km => Radius in km away from location 

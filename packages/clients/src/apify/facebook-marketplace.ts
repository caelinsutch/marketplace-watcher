import { apifyClient } from "./apify";

export type MarketplaceListing = {
  id: string;
  facebookUrl: string;
  listingUrl: string;
  marketplace_listing_title: string;
  listing_price: {
    formatted_amount: string;
    amount_with_offset_in_currency: string;
    amount: string;
  };
  primary_listing_photo: {
    id: string;
    photo_image_url: string;
    __typename: string;
  };
  location?: {
    reverse_geocode?: {
      city?: string;
      state?: string;
      city_page?: {
        display_name?: string;
        id?: string;
      };
    };
  };
  // Add other fields as needed
};

export const getMarketplaceListings = async (
  url: string,
  _page: number,
): Promise<MarketplaceListing[]> => {
  // Prepare Actor input
  const input = {
    startUrls: [
      {
        url,
      },
    ],
    resultsLimit: 20,
  };

  // Run the Actor and wait for it to finish
  const run = await apifyClient.actor("U5DUNxhH3qKt5PnCf").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  console.log("Results from dataset");
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

  const listingItems = items as MarketplaceListing[];

  // Map raw items to the new type
  return listingItems;
};

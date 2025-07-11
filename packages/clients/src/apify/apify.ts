import { ApifyClient } from "apify-client";

const apiKey = process.env.APIFY_API_KEY;

if (!apiKey) {
  throw new Error("APIFY_API_KEY is not set");
}

export const apifyClient = new ApifyClient({
  token: apiKey,
});

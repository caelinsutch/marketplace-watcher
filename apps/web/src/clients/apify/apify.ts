import { env } from "@/env";
import { ApifyClient } from "apify-client";

export const apifyClient = new ApifyClient({
  token: env.APIFY_API_KEY,
});

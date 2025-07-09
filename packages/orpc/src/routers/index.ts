import { matchesRouter } from "./matches";
import { monitorsRouter } from "./monitors";
import { notificationsRouter } from "./notifications";

export const router = {
  monitors: monitorsRouter,
  matches: matchesRouter,
  notifications: notificationsRouter,
};

export type Router = typeof router;

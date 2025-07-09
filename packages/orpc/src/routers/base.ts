import { os } from "@orpc/server";

export const base = os.errors({
  NOT_FOUND: {},
  UNAUTHORIZED: {},
  BAD_REQUEST: {},
});

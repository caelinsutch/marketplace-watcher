import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@marketplace-watcher/db": resolve(__dirname, "../../packages/db/src"),
      "@marketplace-watcher/orpc": resolve(
        __dirname,
        "../../packages/orpc/src",
      ),
      "@marketplace-watcher/ui": resolve(__dirname, "../../packages/ui/src"),
    },
  },
});

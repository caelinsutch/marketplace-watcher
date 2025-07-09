import { afterEach, vi } from "vitest";

// Mock environment variables
vi.stubEnv("NODE_ENV", "test");

// Global test utilities
global.console = {
  ...console,
  // Silence console.log during tests unless explicitly needed
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Mock fetch globally if needed
global.fetch = vi.fn();

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

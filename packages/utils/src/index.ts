export * from "./batch";
export * from "./date";

/**
 * Format a price in cents to a dollar string with currency symbol
 * @param cents - Price in cents (e.g., 35000 for $350.00)
 * @returns Formatted price string (e.g., "$350.00")
 */
export const formatCentsToPrice = (cents: number): string => {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
};

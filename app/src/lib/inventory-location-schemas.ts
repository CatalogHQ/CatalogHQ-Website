import { z } from "zod";

export const inventoryLocationSchema = z.object({
  productId: z.string().uuid("Select a product"),
  locationName: z
    .string()
    .trim()
    .min(1, "Location name is required")
    .max(120, "Location name is too long"),
  stockQty: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(1_000_000, "Stock quantity is too large"),
});

export type InventoryLocationInput = z.infer<typeof inventoryLocationSchema>;

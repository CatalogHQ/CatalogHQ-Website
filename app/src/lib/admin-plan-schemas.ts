import { z } from "zod";

export const adminPlanDraftSchema = z.object({
  name: z.string().trim().min(1, "Display name is required").max(80),
  monthlyPriceNaira: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a valid monthly price in naira")
    .refine((value) => Number.parseInt(value, 10) >= 0, {
      message: "Monthly price cannot be negative",
    }),
  priceSubtext: z.string().trim().max(120),
  tagline: z.string().trim().max(500),
  cta: z.string().trim().min(1, "Button label is required").max(80),
  productLimit: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a valid product limit")
    .refine((value) => Number.parseInt(value, 10) >= 1, {
      message: "Product limit must be at least 1",
    }),
  sortOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a valid sort order")
    .refine((value) => Number.parseInt(value, 10) >= 0, {
      message: "Sort order cannot be negative",
    }),
  popular: z.boolean(),
  active: z.boolean(),
  featureBulletsText: z.string(),
});

export type AdminPlanDraftInput = z.infer<typeof adminPlanDraftSchema>;

export function parseAdminPlanDraft(draft: AdminPlanDraftInput) {
  const parsed = adminPlanDraftSchema.parse(draft);
  const monthlyPriceNaira = Number.parseInt(parsed.monthlyPriceNaira, 10);
  const productLimit = Number.parseInt(parsed.productLimit, 10);
  const sortOrder = Number.parseInt(parsed.sortOrder, 10);

  return {
    name: parsed.name,
    monthlyPriceKobo: monthlyPriceNaira * 100,
    priceSubtext: parsed.priceSubtext,
    tagline: parsed.tagline,
    cta: parsed.cta,
    popular: parsed.popular,
    active: parsed.active,
    productLimit,
    sortOrder,
    featureBullets: parsed.featureBulletsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

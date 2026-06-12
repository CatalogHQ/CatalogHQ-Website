import { z } from "zod";
import { phoneSchema } from "@/lib/auth-schemas";
import { slugify } from "@/lib/slug";
import { parseCustomSizesInput, type SizingTypeId } from "@/lib/sizing-types";
import { isSizingTypeAllowedForCategory } from "@/lib/product-categories";

const sizingTypeSchema = z.enum([
  "none",
  "letter",
  "uk_womens",
  "uk_mens",
  "waist",
  "shoe_uk",
  "shoe_eu",
  "kids",
  "one_size",
  "custom",
]);

const productCategorySchema = z.enum([
  "shoe",
  "shirt",
  "top",
  "jeans",
  "gown",
  "skirt",
  "kids",
  "accessory",
  "other",
]);

const deliveryTypeSchema = z.enum(["pickup", "delivery"]);

export const ninSchema = z
  .string()
  .min(1, "NIN is required")
  .regex(/^\d{11}$/, "NIN must be exactly 11 digits");

const legalNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name is too long")
  .regex(
    /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
    "Use letters, spaces, hyphens, and apostrophes only",
  );

export const slugSchema = z
  .string()
  .min(3, "Store link must be at least 3 characters")
  .max(50, "Store link must be at most 50 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only",
  );

export const storeSetupSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(80, "Business name is too long"),
  legalFirstName: legalNameSchema,
  legalLastName: legalNameSchema,
  bio: z
    .string()
    .min(10, "Tell customers a bit more about your business")
    .max(300, "Bio must be at most 300 characters"),
  whatsapp: phoneSchema,
  nin: ninSchema,
  slug: slugSchema,
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category is too long"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(200, "Address is too long"),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(50, "City is too long"),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .max(50, "State is too long"),
});

export type StoreSetupFormValues = z.infer<typeof storeSetupSchema>;

export const storeSetupStep1Schema = storeSetupSchema.pick({
  businessName: true,
  category: true,
  bio: true,
  slug: true,
});

export const storeSetupStep2Schema = storeSetupSchema.pick({
  address: true,
  city: true,
  state: true,
  whatsapp: true,
});

export const storeSetupStep3Schema = storeSetupSchema.pick({
  legalFirstName: true,
  legalLastName: true,
  nin: true,
});

export const STORE_SETUP_STEPS = [
  {
    id: "business",
    title: "Your business",
    description: "Name your store and choose your public link.",
    fields: ["businessName", "category", "bio", "slug"] as const,
  },
  {
    id: "location",
    title: "Location & contact",
    description: "Where you operate and how customers reach you.",
    fields: ["address", "city", "state", "whatsapp"] as const,
  },
  {
    id: "identity",
    title: "Verify identity",
    description: "Confirm you own this NIN so we can trust your account.",
    fields: ["legalFirstName", "legalLastName", "nin"] as const,
  },
] as const;

export type StoreSetupStepId = (typeof STORE_SETUP_STEPS)[number]["id"];

export function createSlugFromName(name: string): string {
  return slugify(name);
}

export const productSchema = z
  .object({
    name: z.string().min(2, "Product name is required").max(100),
    price: z.number().min(1, "Price must be at least ₦1"),
    stock: z.number().min(0, "Stock cannot be negative"),
    colors: z.string().max(200).optional().or(z.literal("")),
    productCategory: productCategorySchema,
    sizingType: sizingTypeSchema,
    sizes: z.array(z.string()),
    customSizes: z.string().max(200).optional().or(z.literal("")),
    images: z
      .array(z.string())
      .max(2, "You can upload up to 2 images per product"),
    deliveryOptions: z
      .array(deliveryTypeSchema)
      .min(1, "Select at least one delivery option"),
    lowStockThreshold: z
      .number()
      .int("Threshold must be a whole number")
      .min(1, "Threshold must be at least 1")
      .max(100, "Threshold must be at most 100"),
    published: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (
      data.sizingType !== "none" &&
      !isSizingTypeAllowedForCategory(data.productCategory, data.sizingType)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizingType"],
        message: "This sizing type is not available for the selected product type",
      });
      return;
    }

    if (data.sizingType === "none" || data.sizingType === "one_size") {
      return;
    }

    if (data.sizingType === "custom") {
      if (parseCustomSizesInput(data.customSizes ?? "").length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customSizes"],
          message: "Enter at least one custom size",
        });
      }
      return;
    }

    if (data.sizes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizes"],
        message: "Select at least one size",
      });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

export function resolveProductSizes(values: ProductFormValues): {
  sizingType: SizingTypeId;
  sizes: string[];
} {
  if (values.sizingType === "none") {
    return { sizingType: "none", sizes: [] };
  }

  if (values.sizingType === "one_size") {
    return { sizingType: "one_size", sizes: ["One Size"] };
  }

  if (values.sizingType === "custom") {
    return {
      sizingType: "custom",
      sizes: parseCustomSizesInput(values.customSizes ?? ""),
    };
  }

  return {
    sizingType: values.sizingType,
    sizes: values.sizes,
  };
}

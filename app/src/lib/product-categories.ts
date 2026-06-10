import {
  SIZING_TYPES,
  type SizingTypeDefinition,
  type SizingTypeId,
} from "@/lib/sizing-types";

export type ProductCategoryId =
  | "shoe"
  | "shirt"
  | "top"
  | "jeans"
  | "gown"
  | "skirt"
  | "kids"
  | "accessory"
  | "other";

type ProductCategoryDefinition = {
  id: ProductCategoryId;
  label: string;
  keywords: string[];
  sizingTypes: SizingTypeId[];
};

const CATEGORY_DEFINITIONS: ProductCategoryDefinition[] = [
  {
    id: "shoe",
    label: "Shoes & footwear",
    keywords: [
      "shoe",
      "shoes",
      "sneaker",
      "sneakers",
      "sandal",
      "sandals",
      "heel",
      "heels",
      "boot",
      "boots",
      "slipper",
      "slippers",
      "footwear",
      "loafer",
      "loafers",
      "trainer",
      "trainers",
      "pump",
      "pumps",
    ],
    sizingTypes: ["shoe_uk", "shoe_eu", "custom", "one_size", "none"],
  },
  {
    id: "shirt",
    label: "Shirts",
    keywords: [
      "shirt",
      "shirts",
      "polo",
      "button-down",
      "formal shirt",
      "office shirt",
    ],
    sizingTypes: ["letter", "uk_mens", "uk_womens", "custom", "one_size", "none"],
  },
  {
    id: "top",
    label: "Tops & blouses",
    keywords: [
      "top",
      "tops",
      "blouse",
      "blouses",
      "crop",
      "tank",
      "tee",
      "t-shirt",
      "tshirt",
      "camisole",
      "bodysuit",
      "peplum",
    ],
    sizingTypes: ["letter", "uk_womens", "uk_mens", "custom", "one_size", "none"],
  },
  {
    id: "jeans",
    label: "Jeans & trousers",
    keywords: [
      "jean",
      "jeans",
      "denim",
      "trouser",
      "trousers",
      "pant",
      "pants",
      "chino",
      "chinos",
      "jogger",
      "joggers",
      "legging",
      "leggings",
    ],
    sizingTypes: ["waist", "uk_womens", "uk_mens", "letter", "custom", "one_size", "none"],
  },
  {
    id: "gown",
    label: "Gowns & dresses",
    keywords: [
      "gown",
      "gowns",
      "dress",
      "dresses",
      "maxi",
      "midi",
      "asoebi",
      "ankara dress",
      "evening dress",
    ],
    sizingTypes: ["uk_womens", "letter", "custom", "one_size", "none"],
  },
  {
    id: "skirt",
    label: "Skirts",
    keywords: ["skirt", "skirts", "mini skirt", "pencil skirt"],
    sizingTypes: ["uk_womens", "waist", "letter", "custom", "one_size", "none"],
  },
  {
    id: "kids",
    label: "Kids wear",
    keywords: [
      "kid",
      "kids",
      "child",
      "children",
      "baby",
      "infant",
      "toddler",
      "boy",
      "boys",
      "girl",
      "girls",
    ],
    sizingTypes: ["kids", "custom", "one_size", "none"],
  },
  {
    id: "accessory",
    label: "Accessories",
    keywords: [
      "bag",
      "bags",
      "purse",
      "wallet",
      "belt",
      "belts",
      "hat",
      "hats",
      "cap",
      "caps",
      "jewelry",
      "jewellery",
      "necklace",
      "earring",
      "earrings",
      "scarf",
      "scarves",
    ],
    sizingTypes: ["one_size", "custom", "none"],
  },
  {
    id: "other",
    label: "Other",
    keywords: [],
    sizingTypes: [
      "letter",
      "uk_womens",
      "uk_mens",
      "waist",
      "custom",
      "one_size",
      "none",
    ],
  },
];

export const PRODUCT_CATEGORIES = Object.fromEntries(
  CATEGORY_DEFINITIONS.map((category) => [category.id, category]),
) as Record<ProductCategoryId, ProductCategoryDefinition>;

export const PRODUCT_CATEGORY_OPTIONS = CATEGORY_DEFINITIONS.map(
  ({ id, label }) => ({ id, label }),
);

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function matchesKeyword(name: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`);
  return pattern.test(name);
}

export function inferProductCategory(name: string): ProductCategoryId {
  const normalized = normalizeText(name);
  if (!normalized.trim()) return "other";

  let bestMatch: { id: ProductCategoryId; score: number } | null = null;

  for (const category of CATEGORY_DEFINITIONS) {
    if (category.id === "other") continue;

    let score = 0;
    for (const keyword of category.keywords) {
      if (matchesKeyword(normalized, normalizeText(keyword))) {
        score += keyword.includes(" ") ? 2 : 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: category.id, score };
    }
  }

  return bestMatch?.id ?? "other";
}

export function getProductCategory(
  id: ProductCategoryId | null | undefined,
): ProductCategoryDefinition {
  if (!id) return PRODUCT_CATEGORIES.other;
  return PRODUCT_CATEGORIES[id] ?? PRODUCT_CATEGORIES.other;
}

export function getSizingTypesForCategory(
  categoryId: ProductCategoryId,
): SizingTypeDefinition[] {
  const category = getProductCategory(categoryId);
  return category.sizingTypes.map((id) => SIZING_TYPES[id]);
}

export function isSizingTypeAllowedForCategory(
  categoryId: ProductCategoryId,
  sizingType: SizingTypeId,
): boolean {
  return getProductCategory(categoryId).sizingTypes.includes(sizingType);
}

export function getDefaultSizingTypeForCategory(
  categoryId: ProductCategoryId,
): SizingTypeId {
  const options = getProductCategory(categoryId).sizingTypes;
  return options.find((id) => id !== "none") ?? "none";
}

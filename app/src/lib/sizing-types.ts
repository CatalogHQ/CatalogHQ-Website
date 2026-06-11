export type SizingTypeId =
  | "none"
  | "letter"
  | "uk_womens"
  | "uk_mens"
  | "waist"
  | "shoe_uk"
  | "shoe_eu"
  | "kids"
  | "one_size"
  | "custom";

export type SizingTypeDefinition = {
  id: SizingTypeId;
  label: string;
  description: string;
  sizes: string[];
  equivalentLabel?: string;
  equivalents?: Record<string, string>;
};

export const SIZING_TYPES: Record<SizingTypeId, SizingTypeDefinition> = {
  none: {
    id: "none",
    label: "No sizing",
    description: "This product does not use sizes.",
    sizes: [],
  },
  letter: {
    id: "letter",
    label: "Letter sizes (XS–XXL)",
    description: "Standard letter sizing for tops and dresses.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    equivalentLabel: "Approx. UK size",
    equivalents: {
      XS: "UK 6",
      S: "UK 8–10",
      M: "UK 12",
      L: "UK 14",
      XL: "UK 16",
      XXL: "UK 18",
      "3XL": "UK 20",
    },
  },
  uk_womens: {
    id: "uk_womens",
    label: "UK women's sizes",
    description: "Numeric UK dress sizing.",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20"],
    equivalentLabel: "Approx. letter size",
    equivalents: {
      "6": "XS",
      "8": "S",
      "10": "S–M",
      "12": "M",
      "14": "L",
      "16": "XL",
      "18": "XXL",
      "20": "3XL",
    },
  },
  uk_mens: {
    id: "uk_mens",
    label: "UK men's sizes",
    description: "Chest sizing for men's wear.",
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    equivalentLabel: "Approx. chest (in)",
    equivalents: {
      S: '34–36"',
      M: '38–40"',
      L: '42–44"',
      XL: '46–48"',
      XXL: '50–52"',
      "3XL": '54–56"',
    },
  },
  waist: {
    id: "waist",
    label: "Waist sizes (inches)",
    description: "Waist measurement for trousers and skirts.",
    sizes: ["26", "28", "30", "32", "34", "36", "38", "40"],
    equivalentLabel: "Approx. UK size",
    equivalents: {
      "26": "UK 6",
      "28": "UK 8",
      "30": "UK 10",
      "32": "UK 12",
      "34": "UK 14",
      "36": "UK 16",
      "38": "UK 18",
      "40": "UK 20",
    },
  },
  shoe_uk: {
    id: "shoe_uk",
    label: "UK shoe sizes",
    description: "Footwear sizing used in Nigeria and the UK.",
    sizes: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    equivalentLabel: "Approx. EU size",
    equivalents: {
      "3": "EU 36",
      "4": "EU 37",
      "5": "EU 38",
      "6": "EU 39",
      "7": "EU 40",
      "8": "EU 41",
      "9": "EU 42",
      "10": "EU 43",
      "11": "EU 44",
      "12": "EU 45",
    },
  },
  shoe_eu: {
    id: "shoe_eu",
    label: "EU shoe sizes",
    description: "European footwear sizing.",
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
    equivalentLabel: "Approx. UK size",
    equivalents: {
      "36": "UK 3",
      "37": "UK 4",
      "38": "UK 5",
      "39": "UK 6",
      "40": "UK 7",
      "41": "UK 8",
      "42": "UK 9",
      "43": "UK 10",
      "44": "UK 11",
      "45": "UK 12",
    },
  },
  kids: {
    id: "kids",
    label: "Kids ages",
    description: "Age-based sizing for children's wear.",
    sizes: ["0–6M", "6–12M", "1–2Y", "3–4Y", "5–6Y", "7–8Y", "9–10Y", "11–12Y"],
    equivalentLabel: "Approx. height",
    equivalents: {
      "0–6M": "Up to 68 cm",
      "6–12M": "68–80 cm",
      "1–2Y": "80–92 cm",
      "3–4Y": "98–104 cm",
      "5–6Y": "110–116 cm",
      "7–8Y": "122–128 cm",
      "9–10Y": "134–140 cm",
      "11–12Y": "146–152 cm",
    },
  },
  one_size: {
    id: "one_size",
    label: "One size",
    description: "Fits most. No size options needed.",
    sizes: ["One Size"],
  },
  custom: {
    id: "custom",
    label: "Custom sizes",
    description: "Enter your own size labels.",
    sizes: [],
  },
};

export const SIZING_TYPE_OPTIONS = Object.values(SIZING_TYPES).filter(
  (type) => type.id !== "none",
);

export function getSizingType(id: SizingTypeId | null | undefined) {
  if (!id || id === "none") return SIZING_TYPES.none;
  return SIZING_TYPES[id] ?? SIZING_TYPES.none;
}

export function getSizeEquivalent(
  sizingType: SizingTypeId,
  size: string,
): string | undefined {
  const definition = getSizingType(sizingType);
  return definition.equivalents?.[size];
}

export function formatSizesSummary(
  sizingType: SizingTypeId | null | undefined,
  sizes: string[] | undefined,
): string | null {
  if (!sizingType || sizingType === "none" || !sizes?.length) return null;
  const type = getSizingType(sizingType);
  return `${type.label}: ${sizes.join(", ")}`;
}

export function parseCustomSizesInput(value: string): string[] {
  return value
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
}

export function formatCustomSizesInput(sizes: string[] | undefined): string {
  return sizes?.join(", ") ?? "";
}

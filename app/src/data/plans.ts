export type PlanTier = "starter" | "pro" | "growth" | "business";

export type FeatureCategory =
  | "core"
  | "catalog"
  | "sales"
  | "reach"
  | "operations"
  | "support";

export type Plan = {
  id: PlanTier;
  name: string;
  price: string;
  priceSubtext: string;
  tagline: string;
  cta: string;
  popular?: boolean;
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  category: FeatureCategory;
  tier: PlanTier;
  pricingLabel?: string;
  showOnLanding?: boolean;
  comingSoon?: boolean;
};

const COMING_SOON = " (Coming soon)";

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  pro: "Pro",
  growth: "Growth",
  business: "Business",
};

export const PRODUCT_LIMITS: Record<PlanTier, number> = {
  starter: 15,
  pro: 30,
  growth: 50,
  business: 100,
};

export const UNLOCK_ALL_PRO_FEATURES = false;

export function getProductLimit(tier: PlanTier): number {
  if (UNLOCK_ALL_PRO_FEATURES) {
    return PRODUCT_LIMITS.pro;
  }
  return PRODUCT_LIMITS[tier];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "₦3,000",
    priceSubtext: "less than ₦100 a day",
    tagline:
      'For vendors who are tired of chasing transfers and answering the same questions all day. Get a real store, a real checkout, and your time back.',
    cta: "Get Starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦5,000",
    priceSubtext: "less than ₦167 a day",
    tagline:
      "For vendors who are already selling and want to grow without chaos. Inventory that manages itself, analytics that tell you what's working, and tools that turn browsers into buyers.",
    cta: "Get Pro",
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₦8,000",
    priceSubtext: "less than ₦267 a day",
    tagline:
      "Everything in Pro, plus room for a bigger catalog. Built for vendors with a wide product range who need more space without switching platforms.",
    cta: "Get Growth",
  },
];

export const FEATURES: Feature[] = [
  // Core — Starter
  {
    id: "storefront-link",
    title: "Your store, one link",
    description:
      "Drop it in your bio, WhatsApp Status, or a broadcast. Buyers browse your full catalog. No DM needed.",
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "flutterwave-checkout",
    title: "Flutterwave checkout, built in",
    description:
      'Card, bank transfer, USSD. Flutterwave confirms every payment before your order is accepted. No fake screenshots. No "I\'ve sent it."',
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "sell-offline",
    title: "Sell at 3am without being awake",
    description:
      "Your store takes orders, confirms payment, and sends buyers their receipt, around the clock.",
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "nin-verified-vendors",
    title: "NIN-verified vendors",
    description:
      "Every vendor on CatalogHQ completes NIN verification. Customers see a verified badge and know exactly who they are buying from.",
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "order-notifications",
    title: "Order notifications",
    description: "Get alerted instantly when a new order is placed and paid.",
    category: "core",
    tier: "starter",
  },
  {
    id: "order-management",
    title: "Basic order management",
    description: "View orders, update status, and fulfil from one dashboard.",
    category: "core",
    tier: "starter",
  },
  {
    id: "order-status-page",
    title: "Order tracking for your buyers",
    description:
      'Customers follow their order status on their own. "Where is my package?" becomes a message you never receive again.',
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "whatsapp-share",
    title: "WhatsApp share button",
    description: "One tap to share any product to Status, groups, or chats.",
    category: "core",
    tier: "starter",
  },
  {
    id: "product-limit",
    title: "Up to 15 products",
    description: "Enough room to launch and grow your first catalog.",
    category: "catalog",
    tier: "starter",
    pricingLabel: "Up to 15 products",
  },
  {
    id: "product-variants",
    title: "Variants: sizes, colors, options",
    description:
      'List every size, color, and option once. Buyers pick what they want. "Which size do you have?" stops immediately.',
    category: "catalog",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "basic-inventory-tracking",
    title: "Basic inventory tracking",
    description: "Track stock levels on every product and avoid overselling.",
    category: "catalog",
    tier: "starter",
  },
  {
    id: "delivery-types",
    title: "Delivery types",
    description:
      "Offer pickup from vendor or delivery on each product.",
    category: "operations",
    tier: "starter",
  },

  // Pro
  {
    id: "product-limit-pro",
    title: "Up to 30 products",
    description: "Room to grow your catalog without hitting limits.",
    category: "catalog",
    tier: "pro",
    pricingLabel: "Up to 30 products",
  },
  {
    id: "advanced-inventory-tracking",
    title: "Inventory that manages itself",
    description:
      "Stock counts down automatically on every order. When something sells out, it vanishes from your store. No overselling, no awkward refunds.",
    category: "catalog",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "low-stock-alerts",
    title: "Low-stock alerts",
    description: "Know when to restock before you miss another sale.",
    category: "catalog",
    tier: "pro",
  },
  {
    id: "verified-reviews",
    title: "Reviews that build trust automatically",
    description:
      "After delivery, CatalogHQ collects a review from your buyer and displays it on the product. Social proof without asking for it.",
    category: "sales",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "analytics-dashboard",
    title: "Know your numbers",
    description:
      "Total revenue, best-selling products, and full order history in one dashboard. Stop guessing what's working.",
    category: "operations",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "referral-links",
    title: "Customer referral links",
    description:
      "Every customer gets a referral link. They share it. You get new buyers for free.",
    category: "sales",
    tier: "pro",
    comingSoon: true,
  },
  {
    id: "discount-codes",
    title: "Discount codes",
    description:
      "Run promos at scale. No price negotiation in DMs. Set a code, share it, watch it work.",
    category: "sales",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "flash-sales",
    title: "Flash sales with a countdown timer",
    description:
      'Set a time limit on a discount. Buyers who were "just browsing" suddenly need to decide. Urgency converts.',
    category: "sales",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "delivery-zones",
    title: "Delivery zones and fees",
    description: "Set Lagos, Abuja, or nationwide delivery fees upfront.",
    category: "operations",
    tier: "pro",
  },
  {
    id: "payment-links",
    title: "Flutterwave payment links",
    description: "Send a payment link in chat instead of account numbers.",
    category: "sales",
    tier: "starter",
  },
  {
    id: "quick-reply-templates",
    title: "Quick-reply templates",
    description: "Copy-paste payment details, delivery time, and store link blocks.",
    category: "operations",
    tier: "starter",
  },
  {
    id: "reserved-orders",
    title: "5-hour reserved orders",
    description: "Hold stock while friends and family pay later.",
    category: "sales",
    tier: "starter",
  },
  {
    id: "verifiable-receipts",
    title: "Verifiable digital receipts",
    description: "Buyers can verify payment with an order reference link.",
    category: "core",
    tier: "starter",
  },
  {
    id: "order-search",
    title: "Order search and bulk actions",
    description: "Find orders by phone or ref and update many at once.",
    category: "operations",
    tier: "starter",
  },
  {
    id: "abandoned-cart",
    title: "Abandoned cart recovery",
    description: "Win back buyers who left without paying.",
    category: "sales",
    tier: "pro",
  },
  {
    id: "product-limit-growth",
    title: "Up to 50 products",
    description: "Scale your catalog without jumping to enterprise pricing.",
    category: "catalog",
    tier: "growth",
    pricingLabel: "Up to 50 products",
  },
  {
    id: "staff-roles",
    title: "Staff roles and activity log",
    description: "Let helpers fulfil orders without full store access.",
    category: "operations",
    tier: "business",
  },
  {
    id: "multi-location-stock",
    title: "Multi-location inventory",
    description: "Track stock across shop and warehouse locations.",
    category: "catalog",
    tier: "business",
  },
  {
    id: "advanced-analytics",
    title: "Advanced analytics",
    description: "Repeat rate, AOV, and top customers by city.",
    category: "operations",
    tier: "business",
  },
  {
    id: "loyalty-points",
    title: "Loyalty points",
    description: "Reward repeat buyers and keep them coming back.",
    category: "sales",
    tier: "pro",
    comingSoon: true,
  },
  {
    id: "whatsapp-confirmations",
    title: "WhatsApp order confirmations",
    description: "Buyers get instant order updates on WhatsApp automatically.",
    category: "reach",
    tier: "pro",
  },
];

const TIER_ORDER: PlanTier[] = ["starter", "pro", "growth", "business"];

export function tierIncludes(tier: PlanTier, featureTier: PlanTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(featureTier);
}

export function getFeatureById(id: string): Feature | undefined {
  return FEATURES.find((f) => f.id === id);
}

export const PLAN_FEATURE_IDS = FEATURES.map((feature) => feature.id);

export function hasFeature(tier: PlanTier, featureId: string): boolean {
  // UX-only feature gating; backend must enforce plan limits on API routes.
  const feature = getFeatureById(featureId);
  if (!feature) return false;
  if (UNLOCK_ALL_PRO_FEATURES && !feature.comingSoon) {
    return true;
  }
  return tierIncludes(tier, feature.tier);
}

export function getFeaturesForTier(tier: PlanTier): Feature[] {
  return FEATURES.filter((f) => tierIncludes(tier, f.tier));
}

export function getPricingFeaturesForTier(tier: PlanTier): string[] {
  const tierSpecific: Record<PlanTier, string[]> = {
    starter: [
      "Shareable storefront link",
      "Flutterwave checkout",
      "Sell 24/7 while offline",
      "Order notifications",
      "Basic order management",
      "Buyer order status page",
      "WhatsApp share on products",
      "Up to 15 products",
      "Product variants (size, color)",
      "Basic inventory tracking",
      "Delivery types",
    ],
    pro: [
      "Everything in Starter, plus:",
      "Up to 30 products",
      "Advanced inventory tracking + sold-out hide",
      "Low-stock alerts",
      "Verified buyer reviews",
      "Sales analytics dashboard",
      "Delivery zones and fees",
      "Discount codes and flash sales",
      "Order search and bulk actions",
      "Abandoned cart SMS recovery",
      `Customer referral links${COMING_SOON}`,
      `Loyalty points${COMING_SOON}`,
      "WhatsApp order confirmations",
    ],
    growth: [
      "Everything in Pro, plus:",
      "Up to 50 products",
    ],
    business: [
      "Everything in Pro, plus:",
      "Up to 100 products",
      "Staff roles and activity log",
      "Multi-location inventory",
      "Advanced analytics (repeat rate, AOV)",
      "Priority support",
    ],
  };

  return tierSpecific[tier];
}

export function getLandingFeatures(): Feature[] {
  return FEATURES.filter((f) => f.showOnLanding);
}

export type ComparisonCell =
  | "yes"
  | "no"
  | "partial"
  | "basic"
  | "moderate";

export type ComparisonRow = {
  feature: string;
  whatsappTexting: ComparisonCell;
  whatsappCatalog: ComparisonCell;
  cataloghq: ComparisonCell;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Shareable store link",
    whatsappTexting: "no",
    whatsappCatalog: "partial",
    cataloghq: "yes",
  },
  {
    feature: "Works on IG, FB, X too",
    whatsappTexting: "no",
    whatsappCatalog: "no",
    cataloghq: "yes",
  },
  {
    feature: "Integrated payment checkout",
    whatsappTexting: "no",
    whatsappCatalog: "no",
    cataloghq: "yes",
  },
  {
    feature: "No fake transfer screenshots",
    whatsappTexting: "no",
    whatsappCatalog: "no",
    cataloghq: "yes",
  },
  {
    feature: "NIN-verified vendors",
    whatsappTexting: "no",
    whatsappCatalog: "no",
    cataloghq: "yes",
  },
  {
    feature: "Professional storefront",
    whatsappTexting: "no",
    whatsappCatalog: "basic",
    cataloghq: "yes",
  },
  {
    feature: "Browse without signing up",
    whatsappTexting: "no",
    whatsappCatalog: "partial",
    cataloghq: "yes",
  },
  {
    feature: "Organized product catalog",
    whatsappTexting: "no",
    whatsappCatalog: "yes",
    cataloghq: "yes",
  },
  {
    feature: "Order tracking / management",
    whatsappTexting: "no",
    whatsappCatalog: "no",
    cataloghq: "yes",
  },
  {
    feature: "No technical setup needed",
    whatsappTexting: "yes",
    whatsappCatalog: "moderate",
    cataloghq: "yes",
  },
  {
    feature: "Built for small vendors",
    whatsappTexting: "yes",
    whatsappCatalog: "yes",
    cataloghq: "yes",
  },
];

export const COMPARISON_SCORES = {
  whatsappTexting: "1/11",
  whatsappCatalog: "4/11",
  cataloghq: "11/11",
} as const;

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  core: "Core automation",
  catalog: "Catalog and inventory",
  sales: "Sales and growth",
  reach: "Reach customers",
  operations: "Operations and insights",
  support: "Support",
};

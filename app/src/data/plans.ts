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
    priceSubtext: "Less than ₦100 a day",
    tagline:
      "Perfect for new vendors. Stop chasing transfers and answering \"how much?\" all day.",
    cta: "Get Starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦5,000",
    priceSubtext: "Less than ₦167 a day",
    tagline:
      "Advanced inventory, analytics, and growth tools for stores ready to scale.",
    cta: "Get Pro",
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₦8,000",
    priceSubtext: "Less than ₦267 a day",
    tagline:
      "More catalog room and the same Pro tools for vendors with a larger inventory.",
    cta: "Get Growth",
  },
];

export const FEATURES: Feature[] = [
  // Core — Starter
  {
    id: "storefront-link",
    title: "Shareable storefront link",
    description:
      "One link for your bio, Status, and broadcasts. Buyers browse without DMing you.",
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "flutterwave-checkout",
    title: "Automatic Flutterwave checkout",
    description:
      "Customers pay directly on your store. No transfer screenshots, no disputes.",
    category: "core",
    tier: "starter",
    showOnLanding: true,
  },
  {
    id: "sell-offline",
    title: "Sell while you sleep",
    description:
      "Your store takes and confirms orders 24 hours a day, 7 days a week.",
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
    title: "Buyer order status page",
    description:
      "Customers track their order without asking \"where is my package?\"",
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
    title: "Product variants",
    description:
      "Sell sizes, colors, and options. No more \"which size do you have?\"",
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
    title: "Advanced inventory tracking",
    description:
      "Stock auto-decrements on orders. Sold-out products disappear from your store.",
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
    title: "Verified buyer reviews",
    description:
      "Reviews collected automatically after delivery and displayed on every product.",
    category: "sales",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "analytics-dashboard",
    title: "Sales analytics dashboard",
    description:
      "See your best vendors, total revenue, and order history in one place.",
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
    description: "Run promotions without negotiating price in the DMs.",
    category: "sales",
    tier: "pro",
    showOnLanding: true,
  },
  {
    id: "flash-sales",
    title: "Flash sales with countdown",
    description:
      "Set a timed discount and watch browsers become buyers under pressure.",
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

export const COMPARISON_ROWS = [
  {
    feature: "Automatic payment confirmation (no transfer screenshots)",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Takes orders while you are offline",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Inventory tracking with sold-out auto-hide",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Product variants and delivery options",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Order tracking for buyers",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Protected if Meta restricts your account",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Sales analytics dashboard",
    whatsapp: false,
    cataloghq: true,
  },
  {
    feature: "Flash sales, referrals, and loyalty (Pro)",
    whatsapp: false,
    cataloghq: true,
  },
];

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  core: "Core automation",
  catalog: "Catalog and inventory",
  sales: "Sales and growth",
  reach: "Reach customers",
  operations: "Operations and insights",
  support: "Support",
};

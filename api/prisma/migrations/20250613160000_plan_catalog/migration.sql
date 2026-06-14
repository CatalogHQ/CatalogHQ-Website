-- CreateTable
CREATE TABLE "PlanCatalogEntry" (
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPriceKobo" INTEGER NOT NULL,
    "priceSubtext" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "productLimit" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featureBullets" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCatalogEntry_pkey" PRIMARY KEY ("tier")
);

INSERT INTO "PlanCatalogEntry" (
    "tier",
    "name",
    "monthlyPriceKobo",
    "priceSubtext",
    "tagline",
    "cta",
    "popular",
    "productLimit",
    "active",
    "featureBullets",
    "sortOrder",
    "updatedAt"
) VALUES
(
    'starter',
    'Starter',
    300000,
    'Less than ₦100 a day',
    'Perfect for new vendors. Stop chasing transfers and answering "how much?" all day.',
    'Get Starter',
    false,
    15,
    true,
    '["Shareable storefront link","Flutterwave checkout","Sell 24/7 while offline","Order notifications","Basic order management","Buyer order status page","WhatsApp share on products","Up to 15 products","Product variants (size, color)","Basic inventory tracking","Delivery types"]'::jsonb,
    1,
    CURRENT_TIMESTAMP
),
(
    'pro',
    'Pro',
    500000,
    'Less than ₦167 a day',
    'Advanced inventory, analytics, and growth tools for stores ready to scale.',
    'Get Pro',
    true,
    30,
    true,
    '["Everything in Starter, plus:","Up to 30 products","Advanced inventory tracking + sold-out hide","Low-stock alerts","Verified buyer reviews","Sales analytics dashboard","Delivery zones and fees","Discount codes and flash sales","Order search and bulk actions","Abandoned cart SMS recovery","Customer referral links (Coming soon)","Loyalty points (Coming soon)","WhatsApp order confirmations"]'::jsonb,
    2,
    CURRENT_TIMESTAMP
),
(
    'growth',
    'Growth',
    800000,
    'Less than ₦267 a day',
    'More catalog room and the same Pro tools for vendors with a larger inventory.',
    'Get Growth',
    false,
    50,
    true,
    '["Everything in Pro, plus:","Up to 50 products"]'::jsonb,
    3,
    CURRENT_TIMESTAMP
),
(
    'business',
    'Business',
    1200000,
    'For teams and multi-location stores',
    'Staff roles, multi-location stock, and advanced analytics for scaling brands.',
    'Get Business',
    false,
    100,
    false,
    '["Everything in Pro, plus:","Up to 100 products","Staff roles and activity log","Multi-location inventory","Advanced analytics (repeat rate, AOV)","Priority support"]'::jsonb,
    4,
    CURRENT_TIMESTAMP
);

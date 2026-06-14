-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'past_due', 'grace', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('pending', 'paid', 'failed');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "subscriptionExempt" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PlanCatalogEntry" ADD COLUMN "flutterwavePaymentPlanId" INTEGER;

-- CreateTable
CREATE TABLE "VendorSubscription" (
    "vendorId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending',
    "planTier" "PlanTier" NOT NULL DEFAULT 'starter',
    "flutterwaveSubscriptionId" TEXT,
    "flutterwaveCustomerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "graceEndsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastPaymentAt" TIMESTAMP(3),
    "lastPaymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSubscription_pkey" PRIMARY KEY ("vendorId")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "flutterwaveReference" TEXT NOT NULL,
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_flutterwaveReference_key" ON "SubscriptionPayment"("flutterwaveReference");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_vendorId_idx" ON "SubscriptionPayment"("vendorId");

-- AddForeignKey
ALTER TABLE "VendorSubscription" ADD CONSTRAINT "VendorSubscription_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing vendors get 30-day comp subscription
INSERT INTO "VendorSubscription" (
    "vendorId",
    "status",
    "planTier",
    "currentPeriodStart",
    "currentPeriodEnd",
    "updatedAt"
)
SELECT
    u."id",
    'active'::"SubscriptionStatus",
    u."planTier",
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW()
FROM "User" u
WHERE u."role" = 'vendor'
ON CONFLICT ("vendorId") DO NOTHING;

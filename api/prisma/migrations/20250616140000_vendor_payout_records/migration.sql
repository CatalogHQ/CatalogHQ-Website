-- CreateEnum
CREATE TYPE "VendorPayoutMethod" AS ENUM ('instant_transfer', 'split');

-- CreateTable
CREATE TABLE "vendor_payouts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amountNaira" INTEGER NOT NULL,
    "platformFeeNaira" INTEGER NOT NULL DEFAULT 0,
    "method" "VendorPayoutMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "flutterwaveTransferId" TEXT,
    "flutterwaveReference" TEXT,
    "flutterwaveRecipientId" TEXT,
    "bankCode" TEXT,
    "bankName" TEXT,
    "accountNumberLast4" TEXT,
    "accountName" TEXT,
    "failureReason" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "initiatedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "vendorSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payouts_orderId_key" ON "vendor_payouts"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payouts_flutterwaveReference_key" ON "vendor_payouts"("flutterwaveReference");

-- CreateIndex
CREATE INDEX "vendor_payouts_storeId_idx" ON "vendor_payouts"("storeId");

-- CreateIndex
CREATE INDEX "vendor_payouts_storeId_status_idx" ON "vendor_payouts"("storeId", "status");

-- CreateIndex
CREATE INDEX "vendor_payouts_flutterwaveReference_idx" ON "vendor_payouts"("flutterwaveReference");

-- AddForeignKey
ALTER TABLE "vendor_payouts" ADD CONSTRAINT "vendor_payouts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payouts" ADD CONSTRAINT "vendor_payouts_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("vendorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill payout records from existing paid orders
INSERT INTO "vendor_payouts" (
    "id",
    "orderId",
    "storeId",
    "amountNaira",
    "platformFeeNaira",
    "method",
    "status",
    "flutterwaveTransferId",
    "flutterwaveReference",
    "flutterwaveRecipientId",
    "bankCode",
    "bankName",
    "accountNumberLast4",
    "accountName",
    "attemptCount",
    "initiatedAt",
    "settledAt",
    "failedAt",
    "vendorSeenAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    o."id",
    o."storeId",
    o."vendorNet",
    o."platformFee",
    CASE
        WHEN o."payoutStatus" = 'split' THEN 'split'::"VendorPayoutMethod"
        ELSE 'instant_transfer'::"VendorPayoutMethod"
    END,
    o."payoutStatus",
    o."flutterwaveTransferId",
    o."flutterwavePayoutReference",
    s."flutterwaveTransferRecipientId",
    s."payoutBankCode",
    s."payoutBankName",
    CASE
        WHEN s."payoutAccountNumber" IS NULL THEN NULL
        ELSE RIGHT(s."payoutAccountNumber", 4)
    END,
    s."payoutAccountName",
    CASE
        WHEN o."flutterwaveTransferId" IS NOT NULL OR o."payoutStatus" IN ('processing', 'settled', 'failed') THEN 1
        ELSE 0
    END,
    CASE
        WHEN o."payoutStatus" IN ('processing', 'settled') AND o."flutterwaveTransferId" IS NOT NULL THEN o."createdAt"
        WHEN o."payoutStatus" = 'split' THEN o."payoutSettledAt"
        ELSE NULL
    END,
    o."payoutSettledAt",
    CASE
        WHEN o."payoutStatus" = 'failed' THEN COALESCE(o."payoutSettledAt", o."createdAt")
        ELSE NULL
    END,
    o."vendorPayoutSeenAt",
    o."createdAt",
    NOW()
FROM "Order" o
INNER JOIN "Store" s ON s."vendorId" = o."storeId"
WHERE o."paymentStatus" = 'paid'
  AND o."vendorNet" > 0
ON CONFLICT ("orderId") DO NOTHING;

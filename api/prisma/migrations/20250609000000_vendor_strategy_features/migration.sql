-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed');

-- AlterEnum
ALTER TYPE "PlanTier" ADD VALUE 'business';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'reserved';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "quickReplyTemplates" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "deliveryZones" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discountCode" TEXT,
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "paystackReference" TEXT,
ADD COLUMN "transferReference" TEXT,
ADD COLUMN "reservedUntil" TIMESTAMP(3),
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "estimatedDeliveryAt" TIMESTAMP(3),
ADD COLUMN "riderName" TEXT,
ADD COLUMN "riderPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paystackReference_key" ON "Order"("paystackReference");
CREATE INDEX "Order_customerPhone_idx" ON "Order"("customerPhone");

-- CreateTable
CREATE TABLE "ProductStockLocation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductStockLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "flashEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerName" TEXT,
    "cartData" JSONB NOT NULL,
    "recoveredAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMember" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStockLocation_productId_locationName_key" ON "ProductStockLocation"("productId", "locationName");
CREATE UNIQUE INDEX "DiscountCode_storeId_code_key" ON "DiscountCode"("storeId", "code");
CREATE INDEX "DiscountCode_storeId_idx" ON "DiscountCode"("storeId");
CREATE INDEX "AbandonedCart_storeId_idx" ON "AbandonedCart"("storeId");
CREATE UNIQUE INDEX "StoreMember_storeId_userId_key" ON "StoreMember"("storeId", "userId");
CREATE INDEX "ActivityLog_storeId_idx" ON "ActivityLog"("storeId");

-- AddForeignKey
ALTER TABLE "ProductStockLocation" ADD CONSTRAINT "ProductStockLocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("vendorId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("vendorId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("vendorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing paid orders
UPDATE "Order" SET "paymentStatus" = 'paid', "status" = 'paid' WHERE "status" IN ('paid', 'confirmed', 'shipped', 'delivered');

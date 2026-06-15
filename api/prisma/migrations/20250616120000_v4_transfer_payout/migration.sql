-- AlterEnum
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'processing';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "flutterwaveTransferRecipientId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "flutterwaveTransferId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "flutterwavePayoutReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_flutterwavePayoutReference_key" ON "Order"("flutterwavePayoutReference");

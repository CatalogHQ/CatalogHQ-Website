-- AlterEnum
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'processing';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "flutterwaveTransferRecipientId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "flutterwaveTransferId" TEXT;
ALTER TABLE "Order" ADD COLUMN "flutterwavePayoutReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_flutterwavePayoutReference_key" ON "Order"("flutterwavePayoutReference");

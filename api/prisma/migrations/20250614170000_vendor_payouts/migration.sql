-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'split', 'settled', 'failed');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "payoutBankCode" TEXT,
ADD COLUMN "payoutBankName" TEXT,
ADD COLUMN "payoutAccountNumber" TEXT,
ADD COLUMN "payoutAccountName" TEXT,
ADD COLUMN "flutterwaveSubaccountId" TEXT,
ADD COLUMN "payoutSetupComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "payoutSetupAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "vendorNet" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "platformFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'pending';

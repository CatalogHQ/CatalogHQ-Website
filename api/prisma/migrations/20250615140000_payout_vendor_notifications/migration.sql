ALTER TABLE "Order"
ADD COLUMN "payoutSettledAt" TIMESTAMP(3),
ADD COLUMN "vendorPayoutSeenAt" TIMESTAMP(3);

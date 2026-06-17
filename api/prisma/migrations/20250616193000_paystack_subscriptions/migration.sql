-- Paystack Direct Debit subscription fields
ALTER TABLE "PlanCatalogEntry" ADD COLUMN IF NOT EXISTS "paystackPlanCode" TEXT;

ALTER TABLE "VendorSubscription" ADD COLUMN IF NOT EXISTS "paystackCustomerCode" TEXT;
ALTER TABLE "VendorSubscription" ADD COLUMN IF NOT EXISTS "paystackSubscriptionCode" TEXT;
ALTER TABLE "VendorSubscription" ADD COLUMN IF NOT EXISTS "paystackAuthorizationCode" TEXT;
ALTER TABLE "VendorSubscription" ADD COLUMN IF NOT EXISTS "paystackEmailToken" TEXT;

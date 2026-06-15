ALTER TABLE "User"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order"
ADD COLUMN "stockHeldAt" TIMESTAMP(3);

CREATE TABLE "OrderAccessAttempt" (
  "paymentRef" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderAccessAttempt_pkey" PRIMARY KEY ("paymentRef")
);

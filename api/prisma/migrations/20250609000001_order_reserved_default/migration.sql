-- Must run after reserved enum value is committed (separate migration)
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'reserved';

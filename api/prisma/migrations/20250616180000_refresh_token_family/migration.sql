-- Refresh token rotation family + reuse detection
ALTER TABLE "refresh_tokens" ADD COLUMN "familyId" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN "replacedAt" TIMESTAMP(3);

UPDATE "refresh_tokens" SET "familyId" = gen_random_uuid()::text WHERE "familyId" IS NULL;

ALTER TABLE "refresh_tokens" ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- Email-based vendor auth: User.email required, SignupPending + EmailOtp replace PasswordOtp.
-- Existing users without email get a legacy placeholder; update before production.

CREATE TYPE "EmailOtpPurpose" AS ENUM ('signup', 'password_reset');

ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

UPDATE "User"
SET "email" = CONCAT('legacy+', "phone", '@migration.cataloghq.local')
WHERE "email" IS NULL;

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

DROP INDEX IF EXISTS "User_phone_key";
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "SignupPending" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignupPending_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignupPending_email_key" ON "SignupPending"("email");

CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "EmailOtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailOtp_email_purpose_idx" ON "EmailOtp"("email", "purpose");

DROP TABLE IF EXISTS "PasswordOtp";

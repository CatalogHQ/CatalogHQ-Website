-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contactName" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN "contactPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "vendorId" TEXT;

-- CreateTable
CREATE TABLE "PasswordOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordOtp_phone_idx" ON "PasswordOtp"("phone");

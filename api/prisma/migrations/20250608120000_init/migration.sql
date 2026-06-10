-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('starter', 'pro');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('vendor', 'admin');

-- CreateEnum
CREATE TYPE "VendorVerificationStatus" AS ENUM ('unsubmitted', 'pending', 'verified', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'starter',
    "role" "UserRole" NOT NULL DEFAULT 'vendor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "vendorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "nin" TEXT NOT NULL,
    "category" TEXT,
    "city" TEXT,
    "state" TEXT,
    "setupComplete" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VendorVerificationStatus" NOT NULL DEFAULT 'unsubmitted',
    "verificationSubmittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("vendorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

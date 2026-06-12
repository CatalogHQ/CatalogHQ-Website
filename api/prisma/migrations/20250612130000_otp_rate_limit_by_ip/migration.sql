-- Scope OTP rate limits by client IP so one actor cannot lock another user's email globally.

DROP TABLE IF EXISTS "OtpSendLock";

CREATE TABLE "OtpSendLog" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSendLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpSendLog_email_ipAddress_createdAt_idx" ON "OtpSendLog"("email", "ipAddress", "createdAt");
CREATE INDEX "OtpSendLog_ipAddress_createdAt_idx" ON "OtpSendLog"("ipAddress", "createdAt");

CREATE TABLE "OtpSendLock" (
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpSendLock_pkey" PRIMARY KEY ("email","ipAddress")
);

CREATE TABLE "OtpIpSendLock" (
    "ipAddress" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpIpSendLock_pkey" PRIMARY KEY ("ipAddress")
);

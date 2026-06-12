-- Per-email OTP send rate limiting (hour lock after exceeding 2 sends per minute).

CREATE TABLE "OtpSendLock" (
    "email" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpSendLock_pkey" PRIMARY KEY ("email")
);

CREATE INDEX "EmailOtp_email_createdAt_idx" ON "EmailOtp"("email", "createdAt");

export const SIGNUP_VERIFICATION_PENDING_CODE = 'SIGNUP_VERIFICATION_PENDING';

export const OTP_RATE_LIMITED_CODE = 'OTP_RATE_LIMITED';

/** Max OTP emails per email address in a rolling minute. */
export const OTP_SEND_MAX_PER_MINUTE = 2;

export const OTP_SEND_WINDOW_MS = 60_000;

/** Cooldown after exceeding the per-minute OTP send limit. */
export const OTP_SEND_LOCKOUT_MS = 60 * 60 * 1000;

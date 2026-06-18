export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const SIGNUP_VERIFICATION_PENDING_CODE = "SIGNUP_VERIFICATION_PENDING";
export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED";
export const SUBSCRIPTION_EXPIRED_CODE = "SUBSCRIPTION_EXPIRED";

export function isSignupVerificationPending(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.code === SIGNUP_VERIFICATION_PENDING_CODE
  );
}

export function isSubscriptionBlocked(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 402 ||
      error.code === SUBSCRIPTION_REQUIRED_CODE ||
      error.code === SUBSCRIPTION_EXPIRED_CODE)
  );
}

export function isAdminTotpSignInError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("2fa") ||
    message.includes("two-factor") ||
    message.includes("totp")
  );
}

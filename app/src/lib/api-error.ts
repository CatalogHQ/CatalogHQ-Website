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

export function isSignupVerificationPending(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.code === SIGNUP_VERIFICATION_PENDING_CODE
  );
}

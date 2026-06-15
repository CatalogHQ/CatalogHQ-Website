export const CHECKOUT_PAYMENT_METHOD = {
  id: "bank_transfer",
  label: "Bank transfer",
  description: "Transfer to a dedicated account number",
} as const;

export type FlutterwavePaymentMethodId = typeof CHECKOUT_PAYMENT_METHOD.id;

export type PendingPaymentDetails = {
  paymentInstruction?: string;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    expiresAt?: string;
  };
};

const PENDING_PAYMENT_PREFIX = "cataloghq_pending_payment_";

export function savePendingPaymentDetails(
  paymentRef: string,
  details: PendingPaymentDetails,
): void {
  sessionStorage.setItem(
    `${PENDING_PAYMENT_PREFIX}${paymentRef}`,
    JSON.stringify(details),
  );
}

export function loadPendingPaymentDetails(
  paymentRef: string,
): PendingPaymentDetails | null {
  const raw = sessionStorage.getItem(`${PENDING_PAYMENT_PREFIX}${paymentRef}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPaymentDetails;
  } catch {
    return null;
  }
}

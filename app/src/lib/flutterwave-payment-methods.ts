import {
  deleteInMemoryValue,
  getInMemoryValue,
  setInMemoryValue,
} from "@/lib/in-memory-session-store";

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
  totalPaid?: number;
};

const PENDING_PAYMENT_PREFIX = "cataloghq_pending_payment_";

function storageKey(paymentRef: string): string {
  return `${PENDING_PAYMENT_PREFIX}${paymentRef}`;
}

export function savePendingPaymentDetails(
  paymentRef: string,
  details: PendingPaymentDetails,
): void {
  setInMemoryValue(storageKey(paymentRef), JSON.stringify(details));
}

export function loadPendingPaymentDetails(
  paymentRef: string,
): PendingPaymentDetails | null {
  const raw = getInMemoryValue(storageKey(paymentRef));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPaymentDetails;
  } catch {
    return null;
  }
}

export function clearPendingPaymentDetails(paymentRef: string): void {
  deleteInMemoryValue(storageKey(paymentRef));
}

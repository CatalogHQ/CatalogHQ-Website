export const FLUTTERWAVE_PAYMENT_METHODS = [
  { id: "opay", label: "OPay", description: "Pay with OPay wallet" },
  {
    id: "mobile_money",
    label: "Mobile Money (MTN)",
    description: "Approve on your phone",
  },
  { id: "ussd", label: "USSD", description: "Dial a code from your bank" },
  {
    id: "bank_transfer",
    label: "Bank transfer",
    description: "Transfer to a dedicated account",
  },
] as const;

export type FlutterwavePaymentMethodId =
  (typeof FLUTTERWAVE_PAYMENT_METHODS)[number]["id"];

export const USSD_BANK_OPTIONS = [
  { code: "044", label: "Access Bank" },
  { code: "057", label: "Zenith Bank" },
  { code: "035", label: "Wema Bank" },
  { code: "232", label: "Sterling Bank" },
] as const;

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

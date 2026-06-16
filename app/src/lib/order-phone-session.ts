import {
  deleteInMemoryValue,
  getInMemoryValue,
  setInMemoryValue,
} from "@/lib/in-memory-session-store";

const PREFIX = "cataloghq_order_phone_";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function storageKey(paymentRef: string): string {
  return `${PREFIX}${paymentRef}`;
}

export function saveOrderCustomerPhone(
  paymentRef: string,
  phone: string,
): void {
  const normalized = normalizePhone(phone);
  if (normalized.length >= 10) {
    setInMemoryValue(storageKey(paymentRef), normalized);
  }
}

export function loadOrderCustomerPhone(paymentRef: string): string | null {
  return getInMemoryValue(storageKey(paymentRef));
}

export function clearOrderCustomerPhone(paymentRef: string): void {
  deleteInMemoryValue(storageKey(paymentRef));
}

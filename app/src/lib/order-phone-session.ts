const PREFIX = "cataloghq_order_phone_";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function saveOrderCustomerPhone(
  paymentRef: string,
  phone: string,
): void {
  const normalized = normalizePhone(phone);
  if (normalized.length >= 10) {
    sessionStorage.setItem(`${PREFIX}${paymentRef}`, normalized);
  }
}

/** @deprecated Use saveOrderCustomerPhone */
export function saveOrderPhoneLastFour(
  paymentRef: string,
  phone: string,
): void {
  saveOrderCustomerPhone(paymentRef, phone);
}

export function loadOrderCustomerPhone(paymentRef: string): string | null {
  return sessionStorage.getItem(`${PREFIX}${paymentRef}`);
}

/** @deprecated Use loadOrderCustomerPhone */
export function loadOrderPhoneLastFour(paymentRef: string): string | null {
  return loadOrderCustomerPhone(paymentRef);
}

export function buildOrderRefQuery(customerPhone: string): string {
  return `?phone=${encodeURIComponent(normalizePhone(customerPhone))}`;
}

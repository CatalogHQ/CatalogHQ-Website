const PREFIX = "cataloghq_order_phone_";

export function saveOrderPhoneLastFour(
  paymentRef: string,
  phone: string,
): void {
  const last4 = phone.replace(/\D/g, "").slice(-4);
  if (last4.length === 4) {
    sessionStorage.setItem(`${PREFIX}${paymentRef}`, last4);
  }
}

export function loadOrderPhoneLastFour(paymentRef: string): string | null {
  return sessionStorage.getItem(`${PREFIX}${paymentRef}`);
}

export function buildOrderRefQuery(phoneLastFour: string): string {
  return `?phone=${encodeURIComponent(phoneLastFour)}`;
}

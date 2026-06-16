import { useCallback, useState } from "react";
import {
  loadOrderCustomerPhone,
  saveOrderCustomerPhone,
} from "@/lib/order-phone-session";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function useOrderPhoneGate(paymentRef: string) {
  const [customerPhone, setCustomerPhone] = useState<string | null>(() =>
    paymentRef ? loadOrderCustomerPhone(paymentRef) : null,
  );

  const onVerified = useCallback(
    (phone: string) => {
      const normalized = normalizePhone(phone);
      saveOrderCustomerPhone(paymentRef, normalized);
      setCustomerPhone(normalized);
    },
    [paymentRef],
  );

  return {
    customerPhone,
    /** @deprecated Use customerPhone */
    phoneLastFour: customerPhone,
    onVerified,
    needsPhoneGate: Boolean(paymentRef) && !customerPhone,
  };
}

import { useCallback, useState } from "react";
import {
  loadOrderCustomerPhone,
  saveOrderCustomerPhone,
} from "@/lib/order-phone-session";

export function useOrderPhoneGate(paymentRef: string) {
  const [customerPhone, setCustomerPhone] = useState<string | null>(() =>
    paymentRef ? loadOrderCustomerPhone(paymentRef) : null,
  );

  const onVerified = useCallback(
    (phone: string) => {
      saveOrderCustomerPhone(paymentRef, phone);
      setCustomerPhone(phone.replace(/\D/g, ""));
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

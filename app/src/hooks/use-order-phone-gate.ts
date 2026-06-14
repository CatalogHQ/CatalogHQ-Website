import { useCallback, useState } from "react";
import {
  loadOrderPhoneLastFour,
  saveOrderPhoneLastFour,
} from "@/lib/order-phone-session";

export function useOrderPhoneGate(paymentRef: string) {
  const [phoneLastFour, setPhoneLastFour] = useState<string | null>(() =>
    paymentRef ? loadOrderPhoneLastFour(paymentRef) : null,
  );

  const onVerified = useCallback(
    (digits: string) => {
      saveOrderPhoneLastFour(paymentRef, digits);
      setPhoneLastFour(digits);
    },
    [paymentRef],
  );

  return {
    phoneLastFour,
    onVerified,
    needsPhoneGate: Boolean(paymentRef) && !phoneLastFour,
  };
}

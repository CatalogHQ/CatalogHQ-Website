import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  loadOrderCustomerPhone,
  saveOrderCustomerPhone,
} from "@/lib/order-phone-session";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function useOrderPhoneGate(paymentRef: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const phoneFromUrl = searchParams.get("phone");

  const [customerPhone, setCustomerPhone] = useState<string | null>(() => {
    if (phoneFromUrl) {
      const normalized = normalizePhone(phoneFromUrl);
      if (normalized.length >= 10) {
        saveOrderCustomerPhone(paymentRef, normalized);
        return normalized;
      }
    }

    return paymentRef ? loadOrderCustomerPhone(paymentRef) : null;
  });

  useEffect(() => {
    if (!phoneFromUrl || !paymentRef) {
      return;
    }

    const normalized = normalizePhone(phoneFromUrl);
    if (normalized.length >= 10) {
      saveOrderCustomerPhone(paymentRef, normalized);
      setCustomerPhone(normalized);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("phone");
    setSearchParams(nextParams, { replace: true });
  }, [paymentRef, phoneFromUrl, searchParams, setSearchParams]);

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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveOrderPhoneLastFour,
} from "@/lib/order-phone-session";

type OrderPhoneGateProps = {
  paymentRef: string;
  onVerified: (phoneLastFour: string) => void;
};

export default function OrderPhoneGate({
  paymentRef,
  onVerified,
}: OrderPhoneGateProps) {
  const [phoneLastFour, setPhoneLastFour] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const digits = phoneLastFour.replace(/\D/g, "").slice(-4);
    if (digits.length !== 4) return;
    saveOrderPhoneLastFour(paymentRef, digits);
    onVerified(digits);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Verify your order</h2>
        <p className="text-sm text-gray-600">
          Enter the last 4 digits of the phone number used at checkout.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone-last-four">Last 4 digits</Label>
        <Input
          id="phone-last-four"
          inputMode="numeric"
          maxLength={4}
          pattern="\d{4}"
          placeholder="e.g. 5678"
          value={phoneLastFour}
          onChange={(event) =>
            setPhoneLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))
          }
          className="text-center text-lg tracking-widest"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-whatsapp-green hover:bg-whatsapp-dark"
        disabled={phoneLastFour.replace(/\D/g, "").length !== 4}
      >
        View order
      </Button>
    </form>
  );
}

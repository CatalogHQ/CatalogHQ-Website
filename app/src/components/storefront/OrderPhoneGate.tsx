import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOrderCustomerPhone } from "@/lib/order-phone-session";
import { phoneSchema } from "@/lib/auth-schemas";

type OrderPhoneGateProps = {
  paymentRef: string;
  onVerified: (customerPhone: string) => void;
};

export default function OrderPhoneGate({
  paymentRef,
  onVerified,
}: OrderPhoneGateProps) {
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = phoneSchema.safeParse(customerPhone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid phone number.");
      return;
    }

    const normalized = parsed.data.replace(/\D/g, "");
    saveOrderCustomerPhone(paymentRef, normalized);
    setError(null);
    onVerified(normalized);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Verify your order</h2>
        <p className="text-sm text-gray-600">
          Enter the phone number you used at checkout.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="order-customer-phone">Phone number</Label>
        <Input
          id="order-customer-phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="e.g. 08012345678"
          value={customerPhone}
          onChange={(event) => {
            setCustomerPhone(event.target.value);
            setError(null);
          }}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <Button
        type="submit"
        className="w-full bg-whatsapp-green hover:bg-whatsapp-dark"
        disabled={!customerPhone.trim()}
      >
        View order
      </Button>
    </form>
  );
}

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminTotpSetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await apiClient<{ qrCodeDataUrl: string }>(
        "/admin/totp/setup",
        { method: "POST" },
      );
      setQrCode(response.qrCodeDataUrl);
      toast.success("Scan the QR code with your authenticator app.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start 2FA setup.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (token.length !== 6) return;
    setLoading(true);
    try {
      await apiClient("/admin/totp/enable", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      toast.success("Two-factor authentication is now enabled.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid 2FA code.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin 2FA setup</h1>
        <p className="mt-1 text-sm text-gray-600">
          Protect your admin account with an authenticator app.
        </p>
      </div>

      <Button onClick={() => void handleSetup()} disabled={loading}>
        Generate QR code
      </Button>

      {qrCode && (
        <img
          src={qrCode}
          alt="TOTP QR code"
          className="mx-auto h-48 w-48 rounded-lg border bg-white p-2"
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="totp-token">Verification code</Label>
        <Input
          id="totp-token"
          inputMode="numeric"
          maxLength={6}
          value={token}
          onChange={(event) =>
            setToken(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
      </div>

      <Button
        onClick={() => void handleEnable()}
        disabled={loading || token.length !== 6}
        className="w-full"
      >
        Enable 2FA
      </Button>
    </div>
  );
}

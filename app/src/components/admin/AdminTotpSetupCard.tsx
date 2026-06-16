import { useState } from "react";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { totpCodeSchema } from "@/lib/auth-schemas";
import { toast } from "sonner";

type AdminTotpSetupCardProps = {
  onEnabled?: () => void;
};

export default function AdminTotpSetupCard({ onEnabled }: AdminTotpSetupCardProps) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await apiClient<{ otpauthUrl: string }>(
        "/admin/totp/setup",
        { method: "POST" },
      );
      setOtpauthUrl(response.otpauthUrl);
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
    const parsed = totpCodeSchema.safeParse(token);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await apiClient("/admin/totp/enable", {
        method: "POST",
        body: JSON.stringify({ token: parsed.data }),
      });
      await refreshUser();
      toast.success("Two-factor authentication is now enabled.");
      if (onEnabled) {
        onEnabled();
      } else {
        navigate("/admin");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid 2FA code.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Protect your admin account with an authenticator app. You will need a
        current code each time you sign in.
      </p>

      <Button onClick={() => void handleSetup()} disabled={loading}>
        Generate QR code
      </Button>

      {otpauthUrl && (
        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border bg-white p-2">
          <QRCodeSVG value={otpauthUrl} size={176} level="M" />
        </div>
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
      >
        Enable 2FA
      </Button>
    </div>
  );
}

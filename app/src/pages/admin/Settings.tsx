import { useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTotpSetupCard from "@/components/admin/AdminTotpSetupCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const totpEnabled = user?.totpEnabled === true;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage security and account preferences for your admin account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-whatsapp-green" />
                Two-factor authentication
              </CardTitle>
              <CardDescription>
                Require an authenticator app code when signing in to the admin
                dashboard.
              </CardDescription>
            </div>
            {totpEnabled ? (
              <Badge className="shrink-0 bg-whatsapp-green">Enabled</Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Required
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {totpEnabled ? (
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is active on your account. Use your
              authenticator app when signing in.
            </p>
          ) : (
            <AdminTotpSetupCard onEnabled={() => navigate("/admin")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

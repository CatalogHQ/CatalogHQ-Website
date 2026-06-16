import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

/** UI-only gate; admin role and TOTP are enforced by the API, not this route wrapper. */
type AdminRouteProps = {
  children: React.ReactNode;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      toast.error("Admin access required");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?returnTo=${returnTo}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const onAdminSettings = location.pathname === "/admin/settings";

  if (user?.role === "admin" && user.totpEnabled === false && !onAdminSettings) {
    return <Navigate to="/admin/settings" replace />;
  }

  return children;
}

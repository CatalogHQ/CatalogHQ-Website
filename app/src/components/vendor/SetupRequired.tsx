import { Navigate } from "react-router";
import { useVendor } from "@/contexts/VendorContext";
import { Spinner } from "@/components/ui/spinner";

type SetupRequiredProps = {
  children: React.ReactNode;
  requireComplete?: boolean;
  redirectIfComplete?: boolean;
};

export default function SetupRequired({
  children,
  requireComplete = true,
  redirectIfComplete = false,
}: SetupRequiredProps) {
  const { store, isLoading } = useVendor();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (redirectIfComplete && store?.setupComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireComplete && !store?.setupComplete) {
    return <Navigate to="/dashboard/setup" replace />;
  }

  return children;
}

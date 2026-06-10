import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import SupportFab from "@/components/support/SupportFab";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">
        The page you are looking for does not exist.
      </p>
      <Button asChild className="mt-6 bg-whatsapp-green hover:bg-whatsapp-green/90">
        <Link to="/">Back to home</Link>
      </Button>
      <SupportFab audience="customer" />
    </div>
  );
}

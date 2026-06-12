import { Headphones, Mail, MessageCircle, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import {
  buildVendorSupportEmailUrl,
  buildVendorSupportWhatsAppUrl,
  VENDOR_SUPPORT,
} from "@/lib/vendor-support";

type VendorSupportCardProps = {
  storeName?: string;
  compact?: boolean;
};

export default function VendorSupportCard({
  storeName,
  compact = false,
}: VendorSupportCardProps) {
  const whatsappUrl = buildVendorSupportWhatsAppUrl(storeName);
  const emailUrl = buildVendorSupportEmailUrl(storeName);

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Headphones className="h-5 w-5 text-whatsapp-green" />
            Need help?
          </CardTitle>
          <CardDescription>
            Chat with CatalogHQ support about your store, orders, or verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SupportTicketForm
            audience="vendor"
            storeName={storeName}
            trigger={
              <Button type="button" variant="secondary">
                <TicketPlus className="mr-2 h-4 w-4" />
                Submit ticket
              </Button>
            }
          />
          <Button
            asChild
            className="bg-whatsapp-green hover:bg-whatsapp-green/90"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp support
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={emailUrl}>
              <Mail className="mr-2 h-4 w-4" />
              Email us
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customer support</CardTitle>
        <CardDescription>
          Reach the CatalogHQ team for help with your store, payouts, or
          verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border bg-gray-50 px-3 py-2.5">
            <p className="text-gray-500">WhatsApp</p>
            <p className="mt-0.5 font-medium text-gray-900">
              {VENDOR_SUPPORT.whatsapp}
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 px-3 py-2.5">
            <p className="text-gray-500">Email</p>
            <p className="mt-0.5 font-medium text-gray-900">
              {VENDOR_SUPPORT.email}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Available {VENDOR_SUPPORT.hours}. We typically reply within a few
          minutes on WhatsApp.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SupportTicketForm
            audience="vendor"
            storeName={storeName}
            trigger={
              <Button type="button" variant="secondary">
                <TicketPlus className="mr-2 h-4 w-4" />
                Submit a ticket
              </Button>
            }
          />
          <Button
            asChild
            className="bg-whatsapp-green hover:bg-whatsapp-green/90"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Message on WhatsApp
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={emailUrl}>
              <Mail className="mr-2 h-4 w-4" />
              Send an email
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

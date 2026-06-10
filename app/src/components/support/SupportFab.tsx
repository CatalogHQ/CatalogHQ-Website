import { useMemo } from "react";
import { Headphones, Mail, MessageCircle, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import {
  buildCustomerSupportEmailUrl,
  buildCustomerSupportWhatsAppUrl,
  buildVendorSupportEmailUrl,
  buildVendorSupportWhatsAppUrl,
  SUPPORT_CONTACT,
} from "@/lib/vendor-support";
import { cn } from "@/lib/utils";

export type SupportAudience = "vendor" | "customer";

type SupportFabProps = {
  audience: SupportAudience;
  storeName?: string;
  orderRef?: string;
  className?: string;
};

const COPY: Record<
  SupportAudience,
  { description: string; ariaLabel: string }
> = {
  vendor: {
    description:
      "Contact ShopEase support about your store, orders, or verification.",
    ariaLabel: "Need help? Contact ShopEase vendor support",
  },
  customer: {
    description:
      "Contact ShopEase support about your order, payment, or delivery.",
    ariaLabel: "Need help? Contact ShopEase customer support",
  },
};

export default function SupportFab({
  audience,
  storeName,
  orderRef,
  className,
}: SupportFabProps) {
  const context = useMemo(
    () => ({ storeName, orderRef }),
    [storeName, orderRef],
  );

  const whatsappUrl =
    audience === "vendor"
      ? buildVendorSupportWhatsAppUrl(storeName)
      : buildCustomerSupportWhatsAppUrl(context);

  const emailUrl =
    audience === "vendor"
      ? buildVendorSupportEmailUrl(storeName)
      : buildCustomerSupportEmailUrl(context);

  const copy = COPY[audience];

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-5 right-5 z-[100] sm:bottom-6 sm:right-6",
        className,
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            aria-label={copy.ariaLabel}
            className="pointer-events-auto h-14 w-14 rounded-full bg-whatsapp-green text-white shadow-lg hover:bg-whatsapp-green/90 hover:shadow-xl"
          >
            <Headphones className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="pointer-events-auto w-72 p-4"
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Need help?</p>
              <p className="mt-1 text-sm text-gray-600">{copy.description}</p>
              <p className="mt-2 text-xs text-gray-500">
                {SUPPORT_CONTACT.hours}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <SupportTicketForm
                audience={audience}
                storeName={storeName}
                defaultOrderRef={orderRef}
                trigger={
                  <Button type="button" className="w-full">
                    <TicketPlus className="mr-2 h-4 w-4" />
                    Submit a ticket
                  </Button>
                }
              />
              <Button
                asChild
                className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
              >
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp (urgent)
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href={emailUrl}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email us
                </a>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

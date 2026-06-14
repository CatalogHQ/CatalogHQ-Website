import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/order-message";
import { normalizePhoneForWhatsApp } from "@/lib/format";
import { getStoreSocialLinks, type StoreSocialHandles } from "@/lib/social-links";

type StoreContactLinksProps = {
  whatsapp: string;
  businessName: string;
} & StoreSocialHandles;

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  facebook: "FB",
  x: "X",
};

export default function StoreContactLinks({
  whatsapp,
  businessName,
  ...handles
}: StoreContactLinksProps) {
  const whatsappUrl = buildWhatsAppUrl(
    normalizePhoneForWhatsApp(whatsapp),
    `Hi ${businessName}, I found your store on CatalogHQ.`,
  );
  const socialLinks = getStoreSocialLinks(handles);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button
        asChild
        size="sm"
        className="h-8 bg-whatsapp-green text-xs hover:bg-whatsapp-green/90 sm:text-sm"
      >
        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
          WhatsApp
        </a>
      </Button>

      {socialLinks.map((link) => (
        <Button
          key={link.platform}
          asChild
          variant="outline"
          size="sm"
          className="h-8 text-xs sm:text-sm"
        >
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${link.label} @${link.handle}`}
          >
            {SOCIAL_LABELS[link.platform] ?? link.label}
          </a>
        </Button>
      ))}
    </div>
  );
}

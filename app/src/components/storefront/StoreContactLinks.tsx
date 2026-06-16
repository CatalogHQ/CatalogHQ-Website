import { Button } from "@/components/ui/button";
import { getSocialPlatformButtonClass } from "@/lib/social-platform-styles";
import {
  SocialPlatformIcon,
  WhatsAppIcon,
} from "@/components/icons/SocialPlatformIcons";
import { buildWhatsAppUrl } from "@/lib/order-message";
import { normalizePhoneForWhatsApp } from "@/lib/format";
import { getStoreSocialLinks, type StoreSocialHandles } from "@/lib/social-links";
import { cn } from "@/lib/utils";

type StoreContactLinksProps = {
  whatsapp: string;
  businessName: string;
} & StoreSocialHandles;

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
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="mr-1.5" />
          WhatsApp
        </a>
      </Button>

      {socialLinks.map((link) => (
        <Button
          key={link.platform}
          asChild
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0",
            getSocialPlatformButtonClass(link.platform),
          )}
        >
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label} @${link.handle}`}
            title={`${link.label} @${link.handle}`}
          >
            <SocialPlatformIcon platform={link.platform} />
          </a>
        </Button>
      ))}
    </div>
  );
}

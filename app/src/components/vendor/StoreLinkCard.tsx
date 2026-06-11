import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreUrl } from "@/lib/slug";

type StoreLinkCardProps = {
  slug: string;
  title?: string;
};

export default function StoreLinkCard({
  slug,
  title = "Your store link",
}: StoreLinkCardProps) {
  const storeUrl = getStoreUrl(slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      toast.success("Store link copied!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700 break-all">
          {storeUrl}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            Copy link
          </Button>
          <Button type="button" variant="outline" className="gap-2" asChild>
            <a href={storeUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Preview store
            </a>
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Share this link on WhatsApp, Instagram, Facebook, X, or anywhere you
          sell online.
        </p>
      </CardContent>
    </Card>
  );
}

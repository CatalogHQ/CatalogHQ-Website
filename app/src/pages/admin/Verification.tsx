import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { BadgeCheck } from "lucide-react";
import type { AdminVerificationRequest } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import { getStoreUrl } from "@/lib/slug";

export default function AdminVerification() {
  const [queue, setQueue] = useState<AdminVerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      setQueue(await adminRepository.listVerificationQueue());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const handleApprove = async (vendorId: string) => {
    setBusyId(vendorId);
    try {
      await adminRepository.approveVerification(vendorId);
      setQueue((prev) => prev.filter((item) => item.vendorId !== vendorId));
      toast.success("Vendor verified");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not approve vendor.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (vendorId: string) => {
    setBusyId(vendorId);
    try {
      await adminRepository.rejectVerification(vendorId);
      setQueue((prev) => prev.filter((item) => item.vendorId !== vendorId));
      toast.error("Verification rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reject vendor.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification queue</h1>
        <p className="mt-1 text-gray-600">
          Review vendor NIN submissions and approve or reject stores.
        </p>
      </div>

      {queue.length === 0 ? (
        <Empty className="border bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BadgeCheck className="h-6 w-6 text-whatsapp-green" />
            </EmptyMedia>
            <EmptyTitle>Queue is empty</EmptyTitle>
            <EmptyDescription>
              No vendors are waiting for verification review.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {queue.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {request.businessName}
                    </CardTitle>
                    <CardDescription>
                      Submitted{" "}
                      {new Date(request.submittedAt).toLocaleDateString(
                        "en-NG",
                        { dateStyle: "medium" },
                      )}
                      {(request.city || request.state) && (
                        <>
                          {" "}
                          ·{" "}
                          {[request.city, request.state]
                            .filter(Boolean)
                            .join(", ")}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <a
                    href={getStoreUrl(request.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-whatsapp-green hover:text-whatsapp-dark"
                  >
                    View store
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">NIN</p>
                    <p className="font-mono text-gray-900">
                      {request.ninMasked}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === request.vendorId}
                      onClick={() => handleReject(request.vendorId)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                      disabled={busyId === request.vendorId}
                      onClick={() => handleApprove(request.vendorId)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

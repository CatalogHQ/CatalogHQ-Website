import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import TicketPriorityBadge from "@/components/admin/TicketPriorityBadge";
import TicketStatusBadge from "@/components/admin/TicketStatusBadge";
import { sanitizeText } from "@/lib/sanitize";
import type { AdminSupportTicket } from "@/data/admin-mock";

type AdminTicketDetailSheetProps = {
  ticket: AdminSupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    ticketId: string,
    data: {
      status?: AdminSupportTicket["status"];
      priority?: AdminSupportTicket["priority"];
    },
  ) => Promise<void>;
  isUpdating?: boolean;
};

const PRIORITIES: AdminSupportTicket["priority"][] = ["low", "medium", "high"];

export default function AdminTicketDetailSheet({
  ticket,
  open,
  onOpenChange,
  onUpdate,
  isUpdating = false,
}: AdminTicketDetailSheetProps) {
  if (!ticket) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{ticket.subject}</SheetTitle>
          <SheetDescription>
            Opened {new Date(ticket.createdAt).toLocaleString("en-NG")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {ticket.type}
            </Badge>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>

          <div className="rounded-lg border bg-gray-50 p-4 text-sm">
            <p className="text-gray-500">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-gray-900">
              {sanitizeText(ticket.description)}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-gray-500">Contact</p>
              <p className="font-medium text-gray-900">{ticket.contactName}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <a
                href={`tel:${ticket.contactPhone}`}
                className="font-medium text-whatsapp-dark hover:text-whatsapp-green"
              >
                {ticket.contactPhone}
              </a>
            </div>
            {ticket.contactEmail && (
              <div>
                <p className="text-gray-500">Email</p>
                <a
                  href={`mailto:${ticket.contactEmail}`}
                  className="font-medium text-whatsapp-dark hover:text-whatsapp-green"
                >
                  {ticket.contactEmail}
                </a>
              </div>
            )}
            {ticket.storeName && (
              <div>
                <p className="text-gray-500">Store</p>
                <p className="font-medium text-gray-900">{ticket.storeName}</p>
              </div>
            )}
            {ticket.orderRef && (
              <div>
                <p className="text-gray-500">Order ref</p>
                <p className="font-mono text-gray-900">{ticket.orderRef}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-priority">Priority</Label>
            <Select
              value={ticket.priority}
              onValueChange={(priority) =>
                void onUpdate(ticket.id, {
                  priority: priority as AdminSupportTicket["priority"],
                })
              }
              disabled={isUpdating}
            >
              <SelectTrigger id="ticket-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <span className="capitalize">{priority}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ticket.status !== "resolved" && (
            <div className="flex gap-2">
              {ticket.status === "open" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isUpdating}
                  onClick={() =>
                    void onUpdate(ticket.id, { status: "in_progress" })
                  }
                >
                  Start
                </Button>
              )}
              <Button
                className="flex-1 bg-whatsapp-green hover:bg-whatsapp-green/90"
                disabled={isUpdating}
                onClick={() => void onUpdate(ticket.id, { status: "resolved" })}
              >
                Resolve
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

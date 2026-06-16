import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminTicketDetailSheet from "@/components/admin/AdminTicketDetailSheet";
import TicketPriorityBadge from "@/components/admin/TicketPriorityBadge";
import TicketStatusBadge from "@/components/admin/TicketStatusBadge";
import type { AdminSupportTicket } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import { formatDateTimeEnNg } from "@/lib/format";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "open" | "resolved";

export default function AdminTickets() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listTickets();
        if (!cancelled) {
          setTickets(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load tickets.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "open") {
      return tickets.filter(
        (ticket) =>
          ticket.status === "open" || ticket.status === "in_progress",
      );
    }
    return tickets.filter((ticket) => ticket.status === "resolved");
  }, [filter, tickets]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "resolved", label: "Resolved" },
  ];

  const updateTicket = async (
    ticketId: string,
    data: {
      status?: AdminSupportTicket["status"];
      priority?: AdminSupportTicket["priority"];
    },
  ) => {
    setUpdatingId(ticketId);
    try {
      const updated = await adminRepository.updateTicket(ticketId, data);
      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? updated : ticket)),
      );
      setSelectedTicket((current) =>
        current?.id === ticketId ? updated : current,
      );
      if (data.status) {
        toast.success(`Ticket marked as ${data.status.replace("_", " ")}.`);
      } else if (data.priority) {
        toast.success("Ticket priority updated.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update ticket.",
      );
    } finally {
      setUpdatingId(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Support tickets</h1>
        <p className="mt-1 text-gray-600">
          Vendor and customer support requests across the platform.
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={filter === tab.id ? "default" : "outline"}
            size="sm"
            className={cn(
              filter === tab.id &&
                "bg-whatsapp-green hover:bg-whatsapp-green/90",
            )}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Store / Order</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedTicket(ticket)}
              >
                <TableCell className="font-medium text-gray-900">
                  {ticket.subject}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {ticket.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  <p>{ticket.contactName}</p>
                  <p>{ticket.contactPhone}</p>
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {ticket.storeName && <p>{ticket.storeName}</p>}
                  {ticket.orderRef && (
                    <p className="font-mono text-xs">{ticket.orderRef}</p>
                  )}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDateTimeEnNg(ticket.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTickets.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          No tickets in this category.
        </p>
      )}

      <AdminTicketDetailSheet
        ticket={selectedTicket}
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
        onUpdate={updateTicket}
        isUpdating={updatingId === selectedTicket?.id}
      />
    </div>
  );
}

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
import TicketPriorityBadge from "@/components/admin/TicketPriorityBadge";
import TicketStatusBadge from "@/components/admin/TicketStatusBadge";
import type { AdminSupportTicket } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "open" | "resolved";

export default function AdminTickets() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listTickets();
        if (!cancelled) {
          setTickets(result);
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

  const updateStatus = async (
    ticketId: string,
    status: AdminSupportTicket["status"],
  ) => {
    if (!adminRepository.updateTicket) return;

    setUpdatingId(ticketId);
    try {
      const updated = await adminRepository.updateTicket(ticketId, { status });
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, ...updated } : ticket,
        ),
      );
      toast.success(`Ticket marked as ${status.replace("_", " ")}.`);
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
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Store / Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium text-gray-900">
                  {ticket.subject}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {ticket.type}
                  </Badge>
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
                  {new Date(ticket.createdAt).toLocaleDateString("en-NG")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {ticket.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === ticket.id}
                        onClick={() => updateStatus(ticket.id, "in_progress")}
                      >
                        Start
                      </Button>
                    )}
                    {ticket.status !== "resolved" && (
                      <Button
                        size="sm"
                        className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                        disabled={updatingId === ticket.id}
                        onClick={() => updateStatus(ticket.id, "resolved")}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
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
    </div>
  );
}

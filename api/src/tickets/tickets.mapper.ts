import { SupportTicket } from '@prisma/client';

export type SupportTicketDto = {
  id: string;
  subject: string;
  description: string;
  type: SupportTicket['type'];
  status: SupportTicket['status'];
  priority: SupportTicket['priority'];
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  storeName?: string;
  orderRef?: string;
  createdAt: string;
};

export function toTicketDto(ticket: SupportTicket): SupportTicketDto {
  return {
    id: ticket.id,
    subject: ticket.subject,
    description: ticket.description,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    contactName: ticket.contactName,
    contactPhone: ticket.contactPhone,
    contactEmail: ticket.contactEmail ?? undefined,
    storeName: ticket.storeName ?? undefined,
    orderRef: ticket.orderRef ?? undefined,
    createdAt: ticket.createdAt.toISOString(),
  };
}

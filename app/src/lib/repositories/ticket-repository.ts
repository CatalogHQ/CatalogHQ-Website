import type { CreateTicketInput, TicketResponse } from "@/lib/repositories/api-ticket-repository";

export interface TicketRepository {
  createPublic(input: CreateTicketInput): Promise<TicketResponse>;
  createVendor(input: CreateTicketInput): Promise<TicketResponse>;
}

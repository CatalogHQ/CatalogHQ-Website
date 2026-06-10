import type {
  CreateTicketInput,
  TicketResponse,
} from "@/lib/repositories/api-ticket-repository";
import type { TicketRepository } from "@/lib/repositories/ticket-repository";

export class LocalTicketRepository implements TicketRepository {
  async createPublic(input: CreateTicketInput): Promise<TicketResponse> {
    return {
      id: crypto.randomUUID(),
      subject: input.subject,
      status: "open",
    };
  }

  async createVendor(input: CreateTicketInput): Promise<TicketResponse> {
    return this.createPublic(input);
  }
}

export const localTicketRepository = new LocalTicketRepository();

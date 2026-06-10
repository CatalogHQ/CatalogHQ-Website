import { apiClient } from "@/lib/api-client";

export type CreateTicketInput = {
  subject: string;
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  orderRef?: string;
};

export type TicketResponse = {
  id: string;
  subject: string;
  status: string;
};

export class ApiTicketRepository {
  createPublic(input: CreateTicketInput): Promise<TicketResponse> {
    return apiClient<TicketResponse>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createVendor(input: CreateTicketInput): Promise<TicketResponse> {
    return apiClient<TicketResponse>("/support/tickets/vendor", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export const apiTicketRepository = new ApiTicketRepository();

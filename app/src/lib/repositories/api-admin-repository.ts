import { apiClient } from "@/lib/api-client";
import type {
  AdminCustomer,
  AdminPlatformOrder,
  AdminPlatformStats,
  AdminRevenueByDay,
  AdminSupportTicket,
  AdminVendor,
  AdminVerificationRequest,
} from "@/data/admin-mock";

export type AdminBadges = {
  pendingVerifications: number;
  openTickets: number;
};

export type DatePreset = "7d" | "30d" | "90d";

export class ApiAdminRepository {
  getBadges(): Promise<AdminBadges> {
    return apiClient<AdminBadges>("/admin/badges");
  }

  getStats(): Promise<AdminPlatformStats> {
    return apiClient<AdminPlatformStats>("/admin/stats");
  }

  listVendors(): Promise<AdminVendor[]> {
    return apiClient<AdminVendor[]>("/admin/vendors");
  }

  listCustomers(): Promise<AdminCustomer[]> {
    return apiClient<AdminCustomer[]>("/admin/customers");
  }

  listOrders(): Promise<AdminPlatformOrder[]> {
    return apiClient<AdminPlatformOrder[]>("/admin/orders");
  }

  listTickets(): Promise<AdminSupportTicket[]> {
    return apiClient<AdminSupportTicket[]>("/admin/tickets");
  }

  listVerificationQueue(): Promise<AdminVerificationRequest[]> {
    return apiClient<AdminVerificationRequest[]>("/admin/verification");
  }

  approveVerification(vendorId: string): Promise<void> {
    return apiClient<void>(`/admin/verification/${vendorId}/approve`, {
      method: "POST",
    });
  }

  rejectVerification(vendorId: string, reason?: string): Promise<void> {
    return apiClient<void>(`/admin/verification/${vendorId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  getRevenueAnalytics(preset: DatePreset): Promise<AdminRevenueByDay[]> {
    return apiClient<AdminRevenueByDay[]>(
      `/admin/analytics/revenue?preset=${preset}`,
    );
  }

  getTopVendors(limit = 5): Promise<AdminVendor[]> {
    return apiClient<AdminVendor[]>(
      `/admin/analytics/top-vendors?limit=${limit}`,
    );
  }

  updateTicket(
    ticketId: string,
    data: { status?: AdminSupportTicket["status"]; priority?: AdminSupportTicket["priority"] },
  ): Promise<AdminSupportTicket> {
    return apiClient<AdminSupportTicket>(`/admin/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const apiAdminRepository = new ApiAdminRepository();

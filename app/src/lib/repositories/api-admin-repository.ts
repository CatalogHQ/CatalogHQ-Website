import { apiClient } from "@/lib/api-client";
import type { PlanTier } from "@/data/plans";
import type {
  AdminCustomer,
  AdminPlanDistribution,
  AdminPlatformOrder,
  AdminPlatformPayout,
  AdminSubscriptionPayment,
  AdminPlatformStats,
  AdminRevenueByDay,
  AdminSupportTicket,
  AdminVendor,
  AdminVerificationRequest,
} from "@/data/admin-mock";
import type { AdminListDateRange } from "@/lib/admin-date-range";
import { buildAdminDateRangeQuery } from "@/lib/admin-date-range";
import type { OrderStatus } from "@/types/orders";
import type {
  ListSecurityAuditParams,
  SecurityAuditLogList,
} from "@/types/security-audit";
import type { HealthDetailResponse } from "@/types/health-detail";

export type AdminBadges = {
  pendingVerifications: number;
  openTickets: number;
};

export type DatePreset = "7d" | "30d" | "90d" | "month";

export class ApiAdminRepository {
  getBadges(): Promise<AdminBadges> {
    return apiClient<AdminBadges>("/admin/badges");
  }

  getStats(): Promise<AdminPlatformStats> {
    return apiClient<AdminPlatformStats>("/admin/stats");
  }

  listVendors(range: AdminListDateRange = {}): Promise<AdminVendor[]> {
    return apiClient<AdminVendor[]>(
      `/admin/vendors${buildAdminDateRangeQuery(range)}`,
    );
  }

  listCustomers(range: AdminListDateRange = {}): Promise<AdminCustomer[]> {
    return apiClient<AdminCustomer[]>(
      `/admin/customers${buildAdminDateRangeQuery(range)}`,
    );
  }

  listOrders(range: AdminListDateRange = {}): Promise<AdminPlatformOrder[]> {
    return apiClient<AdminPlatformOrder[]>(
      `/admin/orders${buildAdminDateRangeQuery(range)}`,
    );
  }

  listPayouts(range: AdminListDateRange = {}): Promise<AdminPlatformPayout[]> {
    return apiClient<AdminPlatformPayout[]>(
      `/admin/payouts${buildAdminDateRangeQuery(range)}`,
    );
  }

  listSubscriptions(
    range: AdminListDateRange = {},
  ): Promise<AdminSubscriptionPayment[]> {
    return apiClient<AdminSubscriptionPayment[]>(
      `/admin/subscriptions${buildAdminDateRangeQuery(range)}`,
    );
  }

  listTickets(): Promise<AdminSupportTicket[]> {
    return apiClient<AdminSupportTicket[]>("/admin/tickets");
  }

  listVerificationQueue(): Promise<AdminVerificationRequest[]> {
    return apiClient<AdminVerificationRequest[]>("/admin/verification");
  }

  listSecurityLogs(
    params: ListSecurityAuditParams = {},
  ): Promise<SecurityAuditLogList> {
    const searchParams = new URLSearchParams();
    if (params.limit != null) searchParams.set("limit", String(params.limit));
    if (params.offset != null) {
      searchParams.set("offset", String(params.offset));
    }
    if (params.action) searchParams.set("action", params.action);
    if (params.search) searchParams.set("search", params.search);
    if (params.category && params.category !== "all") {
      searchParams.set("category", params.category);
    }

    const query = searchParams.toString();
    return apiClient<SecurityAuditLogList>(
      `/admin/security-logs${query ? `?${query}` : ""}`,
    );
  }

  getHealthDetail(): Promise<HealthDetailResponse> {
    return apiClient<HealthDetailResponse>("/health/detail");
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

  getPlanDistribution(): Promise<AdminPlanDistribution> {
    return apiClient<AdminPlanDistribution>("/admin/analytics/plans");
  }

  updateVendorPlan(vendorId: string, planTier: PlanTier): Promise<AdminVendor> {
    return apiClient<AdminVendor>(`/admin/vendors/${vendorId}`, {
      method: "PATCH",
      body: JSON.stringify({ planTier }),
    });
  }

  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<AdminPlatformOrder> {
    return apiClient<AdminPlatformOrder>(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  confirmOrderPayment(orderId: string): Promise<AdminPlatformOrder> {
    return apiClient<AdminPlatformOrder>(
      `/admin/orders/${orderId}/confirm-payment`,
      { method: "POST" },
    );
  }

  updateTicket(
    ticketId: string,
    data: {
      status?: AdminSupportTicket["status"];
      priority?: AdminSupportTicket["priority"];
    },
  ): Promise<AdminSupportTicket> {
    return apiClient<AdminSupportTicket>(`/admin/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const apiAdminRepository = new ApiAdminRepository();

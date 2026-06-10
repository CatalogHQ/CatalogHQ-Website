import {
  ADMIN_MOCK_CUSTOMERS,
  ADMIN_MOCK_ORDERS,
  ADMIN_MOCK_REVENUE_BY_DAY,
  ADMIN_MOCK_STATS,
  ADMIN_MOCK_TICKETS,
  ADMIN_MOCK_VENDORS,
  ADMIN_MOCK_VERIFICATION_QUEUE,
  getOpenTicketCount,
  getPendingVerificationCount,
  getTopVendorsByRevenue,
  type AdminCustomer,
  type AdminPlatformOrder,
  type AdminPlatformStats,
  type AdminRevenueByDay,
  type AdminSupportTicket,
  type AdminVendor,
  type AdminVerificationRequest,
} from "@/data/admin-mock";
import type {
  AdminBadges,
  ApiAdminRepository,
  DatePreset,
} from "@/lib/repositories/api-admin-repository";

export class LocalAdminRepository implements Pick<
  ApiAdminRepository,
  | "getBadges"
  | "getStats"
  | "listVendors"
  | "listCustomers"
  | "listOrders"
  | "listTickets"
  | "listVerificationQueue"
  | "approveVerification"
  | "rejectVerification"
  | "getRevenueAnalytics"
  | "getTopVendors"
  | "updateTicket"
> {
  private verificationQueue = [...ADMIN_MOCK_VERIFICATION_QUEUE];

  getBadges(): Promise<AdminBadges> {
    return Promise.resolve({
      pendingVerifications: getPendingVerificationCount(),
      openTickets: getOpenTicketCount(),
    });
  }

  getStats(): Promise<AdminPlatformStats> {
    return Promise.resolve(ADMIN_MOCK_STATS);
  }

  listVendors(): Promise<AdminVendor[]> {
    return Promise.resolve(ADMIN_MOCK_VENDORS);
  }

  listCustomers(): Promise<AdminCustomer[]> {
    return Promise.resolve(ADMIN_MOCK_CUSTOMERS);
  }

  listOrders(): Promise<AdminPlatformOrder[]> {
    return Promise.resolve(ADMIN_MOCK_ORDERS);
  }

  listTickets(): Promise<AdminSupportTicket[]> {
    return Promise.resolve(ADMIN_MOCK_TICKETS);
  }

  listVerificationQueue(): Promise<AdminVerificationRequest[]> {
    return Promise.resolve(this.verificationQueue);
  }

  approveVerification(vendorId: string): Promise<void> {
    this.verificationQueue = this.verificationQueue.filter(
      (item) => item.vendorId !== vendorId,
    );
    return Promise.resolve();
  }

  rejectVerification(vendorId: string): Promise<void> {
    this.verificationQueue = this.verificationQueue.filter(
      (item) => item.vendorId !== vendorId,
    );
    return Promise.resolve();
  }

  getRevenueAnalytics(preset: DatePreset): Promise<AdminRevenueByDay[]> {
    if (preset === "7d") {
      return Promise.resolve(ADMIN_MOCK_REVENUE_BY_DAY);
    }

    if (preset === "30d") {
      return Promise.resolve(
        ADMIN_MOCK_REVENUE_BY_DAY.map((entry, index) => ({
          ...entry,
          revenue: entry.revenue * (1 + index * 0.15),
          label: `Week ${index + 1}`,
        })),
      );
    }

    return Promise.resolve(
      ADMIN_MOCK_REVENUE_BY_DAY.map((entry, index) => ({
        ...entry,
        revenue: entry.revenue * (2 + index * 0.3),
        label: `Month ${index + 1}`,
      })),
    );
  }

  getTopVendors(limit = 5): Promise<AdminVendor[]> {
    return Promise.resolve(getTopVendorsByRevenue(limit));
  }

  updateTicket(
    ticketId: string,
    data: { status?: AdminSupportTicket["status"] },
  ): Promise<AdminSupportTicket> {
    const ticket = ADMIN_MOCK_TICKETS.find((entry) => entry.id === ticketId);
    if (!ticket) {
      return Promise.reject(new Error("Ticket not found."));
    }
    return Promise.resolve({
      ...ticket,
      status: data.status ?? ticket.status,
    });
  }
}

export const localAdminRepository = new LocalAdminRepository();

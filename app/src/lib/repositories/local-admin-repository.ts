import type { PlanTier } from "@/data/plans";
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
  type AdminPlanDistribution,
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
import type { OrderStatus } from "@/types/orders";

export class LocalAdminRepository implements ApiAdminRepository {
  private verificationQueue = [...ADMIN_MOCK_VERIFICATION_QUEUE];
  private vendors = [...ADMIN_MOCK_VENDORS];
  private orders = [...ADMIN_MOCK_ORDERS];

  getBadges(): Promise<AdminBadges> {
    return Promise.resolve({
      pendingVerifications: getPendingVerificationCount(),
      openTickets: getOpenTicketCount(),
    });
  }

  getStats(): Promise<AdminPlatformStats> {
    return Promise.resolve({
      ...ADMIN_MOCK_STATS,
      pendingPayments: this.orders.filter((o) => o.paymentStatus === "pending")
        .length,
      failedPayments: this.orders.filter((o) => o.paymentStatus === "failed")
        .length,
    });
  }

  listVendors(): Promise<AdminVendor[]> {
    return Promise.resolve(this.vendors);
  }

  listCustomers(): Promise<AdminCustomer[]> {
    return Promise.resolve(ADMIN_MOCK_CUSTOMERS);
  }

  listOrders(): Promise<AdminPlatformOrder[]> {
    return Promise.resolve(this.orders);
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

  rejectVerification(_vendorId: string, _reason?: string): Promise<void> {
    this.verificationQueue = this.verificationQueue.filter(
      (item) => item.vendorId !== _vendorId,
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

  getPlanDistribution(): Promise<AdminPlanDistribution> {
    const counts = new Map<PlanTier, number>();
    for (const vendor of this.vendors) {
      counts.set(vendor.planTier, (counts.get(vendor.planTier) ?? 0) + 1);
    }

    return Promise.resolve(
      (["starter", "pro", "growth", "business"] as PlanTier[]).map((tier) => ({
        tier,
        count: counts.get(tier) ?? 0,
      })),
    );
  }

  updateVendorPlan(vendorId: string, planTier: PlanTier): Promise<AdminVendor> {
    const index = this.vendors.findIndex((vendor) => vendor.id === vendorId);
    if (index === -1) {
      return Promise.reject(new Error("Vendor not found."));
    }

    this.vendors[index] = { ...this.vendors[index], planTier };
    return Promise.resolve(this.vendors[index]);
  }

  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<AdminPlatformOrder> {
    const index = this.orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return Promise.reject(new Error("Order not found."));
    }

    this.orders[index] = { ...this.orders[index], status };
    return Promise.resolve(this.orders[index]);
  }

  confirmOrderPayment(orderId: string): Promise<AdminPlatformOrder> {
    const index = this.orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return Promise.reject(new Error("Order not found."));
    }

    this.orders[index] = {
      ...this.orders[index],
      paymentStatus: "paid",
      status: "paid",
    };
    return Promise.resolve(this.orders[index]);
  }

  updateTicket(
    ticketId: string,
    data: {
      status?: AdminSupportTicket["status"];
      priority?: AdminSupportTicket["priority"];
    },
  ): Promise<AdminSupportTicket> {
    const ticket = ADMIN_MOCK_TICKETS.find((entry) => entry.id === ticketId);
    if (!ticket) {
      return Promise.reject(new Error("Ticket not found."));
    }

    return Promise.resolve({
      ...ticket,
      status: data.status ?? ticket.status,
      priority: data.priority ?? ticket.priority,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const localAdminRepository = new LocalAdminRepository();

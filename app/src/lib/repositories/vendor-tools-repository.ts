import { apiClient } from "@/lib/api-client";
import type { DeliveryZone } from "@/lib/delivery-zones";
import { isApiMode } from "@/lib/use-api";

export type QuickReplyTemplate = {
  id: string;
  title: string;
  body: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt?: string;
  maxUses?: number;
  useCount: number;
  active: boolean;
  flashEndsAt?: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  userId: string;
  phone: string;
  role: string;
  createdAt: string;
};

export type ActivityLogEntry = {
  id: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AdvancedAnalytics = {
  repeatCustomerRate: number;
  averageOrderValue: number;
  ordersByCity: { city: string; count: number }[];
  topCustomers: { phone: string; name: string; orderCount: number }[];
};

export type PaymentLinkResponse = {
  authorizationUrl: string;
  reference: string;
};

export type StockLocation = {
  id: string;
  productId: string;
  locationName: string;
  stock: number;
};

const localQuickReplies: QuickReplyTemplate[] = [];
const localZones: DeliveryZone[] = [];
const localDiscountCodes: DiscountCode[] = [];

export const vendorToolsRepository = {
  async getQuickReplies(): Promise<QuickReplyTemplate[]> {
    if (!isApiMode()) return localQuickReplies;
    return apiClient<QuickReplyTemplate[]>("/stores/me/quick-replies");
  },

  async saveQuickReplies(templates: QuickReplyTemplate[]): Promise<QuickReplyTemplate[]> {
    if (!isApiMode()) {
      localQuickReplies.splice(0, localQuickReplies.length, ...templates);
      return templates;
    }
    return apiClient<QuickReplyTemplate[]>("/stores/me/quick-replies", {
      method: "PUT",
      body: JSON.stringify(templates),
    });
  },

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    if (!isApiMode()) return localZones;
    return apiClient<DeliveryZone[]>("/stores/me/delivery-zones");
  },

  async saveDeliveryZones(zones: DeliveryZone[]): Promise<DeliveryZone[]> {
    if (!isApiMode()) {
      localZones.splice(0, localZones.length, ...zones);
      return zones;
    }
    return apiClient<DeliveryZone[]>("/stores/me/delivery-zones", {
      method: "PUT",
      body: JSON.stringify(zones),
    });
  },

  async listDiscountCodes(): Promise<DiscountCode[]> {
    if (!isApiMode()) return localDiscountCodes;
    return apiClient<DiscountCode[]>("/stores/me/discount-codes");
  },

  async createDiscountCode(input: {
    code: string;
    type: "percent" | "fixed";
    value: number;
    expiresAt?: string;
    maxUses?: number;
    flashEndsAt?: string;
  }): Promise<DiscountCode> {
    if (!isApiMode()) {
      const created: DiscountCode = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        useCount: 0,
        active: true,
        createdAt: new Date().toISOString(),
      };
      localDiscountCodes.push(created);
      return created;
    }
    return apiClient<DiscountCode>("/stores/me/discount-codes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async deleteDiscountCode(id: string): Promise<void> {
    if (!isApiMode()) {
      const index = localDiscountCodes.findIndex((code) => code.id === id);
      if (index >= 0) localDiscountCodes.splice(index, 1);
      return;
    }
    await apiClient(`/stores/me/discount-codes/${id}`, { method: "DELETE" });
  },

  async getPaymentLink(orderId: string): Promise<PaymentLinkResponse> {
    return apiClient<PaymentLinkResponse>(
      `/stores/me/orders/${orderId}/payment-link`,
      { method: "POST" },
    );
  },

  async listTeam(): Promise<TeamMember[]> {
    if (!isApiMode()) return [];
    return apiClient<TeamMember[]>("/stores/me/team");
  },

  async addTeamMember(phone: string, role: "fulfiller"): Promise<TeamMember> {
    return apiClient<TeamMember>("/stores/me/team", {
      method: "POST",
      body: JSON.stringify({ phone, role }),
    });
  },

  async removeTeamMember(memberId: string): Promise<void> {
    await apiClient(`/stores/me/team/${memberId}`, { method: "DELETE" });
  },

  async listActivity(): Promise<ActivityLogEntry[]> {
    if (!isApiMode()) return [];
    return apiClient<ActivityLogEntry[]>("/stores/me/activity");
  },

  async listStockLocations(productId: string): Promise<StockLocation[]> {
    if (!isApiMode()) return [];
    return apiClient<StockLocation[]>(
      `/stores/me/products/${productId}/stock-locations`,
    );
  },

  async upsertStockLocation(
    productId: string,
    locationName: string,
    stock: number,
  ): Promise<StockLocation> {
    return apiClient<StockLocation>(
      `/stores/me/products/${productId}/stock-locations`,
      {
        method: "PUT",
        body: JSON.stringify({ locationName, stock }),
      },
    );
  },

  async getAdvancedAnalytics(): Promise<AdvancedAnalytics> {
    if (!isApiMode()) {
      return {
        repeatCustomerRate: 0,
        averageOrderValue: 0,
        ordersByCity: [],
        topCustomers: [],
      };
    }
    return apiClient<AdvancedAnalytics>("/stores/me/analytics/advanced");
  },
};

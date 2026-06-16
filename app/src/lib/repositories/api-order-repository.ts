import { apiClient } from "@/lib/api-client";
import type { OrderRepository } from "@/lib/repositories/order-repository";
import type {
  CheckoutInput,
  CheckoutResult,
  CustomerOrder,
  CustomerOrderInput,
  OrderReceipt,
  OrderStatus,
} from "@/types/orders";

type OrderResponse = {
  order: CustomerOrder;
};

type UnreadCountResponse = {
  count: number;
  payoutCount: number;
};

function orderAccessBody(customerPhone: string): string {
  return JSON.stringify({ phone: customerPhone });
}

export class ApiOrderRepository implements OrderRepository {
  async create(input: CustomerOrderInput): Promise<CustomerOrder> {
    return apiClient<CustomerOrder>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    return apiClient<CheckoutResult>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async reserve(
    input: CustomerOrderInput & {
      deliveryZoneId?: string;
      discountCode?: string;
    },
  ): Promise<CustomerOrder> {
    return apiClient<CustomerOrder>("/orders/reserve", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async verifyPayment(
    paymentRef: string,
    phoneLastFour: string,
  ): Promise<CustomerOrder> {
    const response = await apiClient<OrderResponse>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/verify`,
      {
        method: "POST",
        body: orderAccessBody(phoneLastFour),
      },
    );
    return response.order;
  }

  async getReceipt(
    paymentRef: string,
    phoneLastFour: string,
  ): Promise<OrderReceipt> {
    return apiClient<OrderReceipt>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/receipt`,
      {
        method: "POST",
        body: orderAccessBody(phoneLastFour),
      },
    );
  }

  async markTransferReference(
    paymentRef: string,
    transferReference: string,
    phoneLastFour: string,
  ): Promise<CustomerOrder> {
    return apiClient<CustomerOrder>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/transfer`,
      {
        method: "PATCH",
        body: JSON.stringify({ transferReference, customerPhone: phoneLastFour }),
      },
    );
  }

  async listByStoreId(
    _storeId: string,
    query?: string,
  ): Promise<CustomerOrder[]> {
    const params = query?.trim()
      ? `?q=${encodeURIComponent(query.trim())}`
      : "";
    return apiClient<CustomerOrder[]>(`/stores/me/orders${params}`);
  }

  async getByPaymentRef(
    paymentRef: string,
    phoneLastFour: string,
  ): Promise<CustomerOrder | null> {
    try {
      const response = await apiClient<OrderResponse>(
        `/orders/ref/${encodeURIComponent(paymentRef)}/access`,
        {
          method: "POST",
          body: orderAccessBody(phoneLastFour),
        },
      );
      return response.order;
    } catch {
      return null;
    }
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<CustomerOrder> {
    return apiClient<CustomerOrder>(
      `/stores/me/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
  }

  async bulkUpdateStatus(
    orderIds: string[],
    status: OrderStatus,
  ): Promise<CustomerOrder[]> {
    return apiClient<CustomerOrder[]>("/stores/me/orders/bulk-status", {
      method: "POST",
      body: JSON.stringify({ orderIds, status }),
    });
  }

  async getCustomerOrderCount(phone: string): Promise<number> {
    return apiClient<number>(
      `/stores/me/orders/customer-count/${encodeURIComponent(phone)}`,
    );
  }

  async markAllSeen(_storeId: string): Promise<void> {
    await apiClient("/stores/me/orders/mark-seen", { method: "POST" });
  }

  async markAllPayoutsSeen(_storeId: string): Promise<void> {
    await apiClient("/stores/me/payouts/mark-seen", { method: "POST" });
  }

  async getUnreadCounts(_storeId: string): Promise<{
    orderCount: number;
    payoutCount: number;
  }> {
    const response = await apiClient<UnreadCountResponse>(
      "/stores/me/orders/unread-count",
    );
    return {
      orderCount: response.count,
      payoutCount: response.payoutCount ?? 0,
    };
  }

  async trackAbandonedCart(input: {
    storeId: string;
    productId: string;
    customerPhone?: string;
    customerName?: string;
    cartData: Record<string, unknown>;
  }): Promise<void> {
    await apiClient("/orders/abandoned-cart", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export const apiOrderRepository = new ApiOrderRepository();

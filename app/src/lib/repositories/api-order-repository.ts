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
};


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

  async verifyPayment(paymentRef: string): Promise<CustomerOrder> {
    const response = await apiClient<OrderResponse>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/verify`,
      { method: "POST" },
    );
    return response.order;
  }

  async getReceipt(paymentRef: string): Promise<OrderReceipt> {
    return apiClient<OrderReceipt>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/receipt`,
    );
  }

  async markTransferReference(
    paymentRef: string,
    transferReference: string,
  ): Promise<CustomerOrder> {
    return apiClient<CustomerOrder>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/transfer`,
      {
        method: "PATCH",
        body: JSON.stringify({ transferReference }),
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

  async getByPaymentRef(paymentRef: string): Promise<CustomerOrder | null> {
    try {
      const response = await apiClient<OrderResponse>(
        `/orders/ref/${encodeURIComponent(paymentRef)}`,
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

  async getUnreadCount(_storeId: string): Promise<number> {
    const response = await apiClient<UnreadCountResponse>(
      "/stores/me/orders/unread-count",
    );
    return response.count;
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

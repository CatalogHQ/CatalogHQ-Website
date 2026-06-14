import { readJson, writeJson } from "@/lib/local-storage";
import { computeCheckoutPricing } from "@/lib/flutterwave-fees";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { OrderRepository } from "@/lib/repositories/order-repository";
import type {
  CheckoutInput,
  CheckoutResult,
  CustomerOrder,
  CustomerOrderInput,
  OrderReceipt,
  OrderStatus,
} from "@/types/orders";

function generatePaymentRef(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const shortId = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `SHP-${datePart}-${shortId}`;
}

function buildOrder(
  input: CustomerOrderInput,
  overrides?: Partial<CustomerOrder>,
): CustomerOrder {
  const products = readJson<{ id: string; price: number }[]>(
    STORAGE_KEYS.products,
    [],
  );
  const product = products.find((entry) => entry.id === input.productId);
  const unitPrice = product?.price ?? 0;
  const deliveryFee = overrides?.deliveryFee ?? 0;
  const discountAmount = overrides?.discountAmount ?? 0;
  const vendorNet = Math.max(
    0,
    unitPrice * input.quantity + deliveryFee - discountAmount,
  );
  const totalPaid =
    overrides?.totalPaid ?? computeCheckoutPricing(vendorNet).customerTotal;
  const paymentRef = overrides?.paymentRef ?? generatePaymentRef();

  return {
    ...input,
    unitPrice,
    deliveryFee,
    discountAmount,
    totalPaid,
    id: overrides?.id ?? crypto.randomUUID(),
    paymentRef,
    status: overrides?.status ?? "paid",
    paymentStatus: overrides?.paymentStatus ?? "paid",
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    ...overrides,
  };
}

export class LocalOrderRepository implements OrderRepository {
  private getOrders(): CustomerOrder[] {
    return readJson<CustomerOrder[]>(STORAGE_KEYS.orders, []);
  }

  private saveOrders(orders: CustomerOrder[]): void {
    writeJson(STORAGE_KEYS.orders, orders);
  }

  async create(input: CustomerOrderInput): Promise<CustomerOrder> {
    const order = buildOrder(input);
    const orders = this.getOrders();
    orders.push(order);
    this.saveOrders(orders);
    return order;
  }

  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    void input.storeSlug;
    void input.paymentMethod;
    void input.ussdBankCode;
    const order = buildOrder(input, {
      status: "paid",
      paymentStatus: "paid",
    });
    const orders = this.getOrders();
    orders.push(order);
    this.saveOrders(orders);
    return {
      order,
      payment: {
        mock: true,
        authorizationUrl: null,
        reference: `flw_${order.paymentRef}`,
      },
    };
  }

  async reserve(
    input: CustomerOrderInput & {
      deliveryZoneId?: string;
      discountCode?: string;
    },
  ): Promise<CustomerOrder> {
    const order = buildOrder(input, {
      status: "reserved",
      paymentStatus: "pending",
      reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    const orders = this.getOrders();
    orders.push(order);
    this.saveOrders(orders);
    return order;
  }

  async verifyPayment(paymentRef: string): Promise<CustomerOrder> {
    const order = await this.getByPaymentRef(paymentRef);
    if (!order) throw new Error("Order not found.");
    if (order.paymentStatus === "paid") return order;
    return this.updateStatus(order.id, "paid");
  }

  async getReceipt(paymentRef: string): Promise<OrderReceipt> {
    const order = await this.getByPaymentRef(paymentRef);
    if (!order) throw new Error("Order not found.");
    return {
      valid: order.paymentStatus === "paid" || order.status !== "reserved",
      order,
      verifyUrl: `/receipt/${order.paymentRef}`,
    };
  }

  async markTransferReference(
    paymentRef: string,
    transferReference: string,
  ): Promise<CustomerOrder> {
    const orders = this.getOrders();
    const index = orders.findIndex(
      (order) => order.paymentRef.toUpperCase() === paymentRef.toUpperCase(),
    );
    if (index < 0) throw new Error("Order not found.");
    orders[index] = { ...orders[index], transferReference };
    this.saveOrders(orders);
    return orders[index];
  }

  async listByStoreId(storeId: string, query?: string): Promise<CustomerOrder[]> {
    const term = query?.trim().toLowerCase();
    return this.getOrders()
      .filter((order) => {
        if (order.storeId !== storeId) return false;
        if (!term) return true;
        return (
          order.paymentRef.toLowerCase().includes(term) ||
          order.customerPhone.includes(term) ||
          order.customerName.toLowerCase().includes(term)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async getByPaymentRef(paymentRef: string): Promise<CustomerOrder | null> {
    return (
      this.getOrders().find(
        (order) => order.paymentRef.toUpperCase() === paymentRef.toUpperCase(),
      ) ?? null
    );
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<CustomerOrder> {
    const orders = this.getOrders();
    const index = orders.findIndex((order) => order.id === orderId);

    if (index < 0) {
      throw new Error("Order not found.");
    }

    orders[index] = {
      ...orders[index],
      status,
      paymentStatus: status === "paid" ? "paid" : orders[index].paymentStatus,
    };
    this.saveOrders(orders);
    return orders[index];
  }

  async bulkUpdateStatus(
    orderIds: string[],
    status: OrderStatus,
  ): Promise<CustomerOrder[]> {
    const results: CustomerOrder[] = [];
    for (const orderId of orderIds) {
      results.push(await this.updateStatus(orderId, status));
    }
    return results;
  }

  async getCustomerOrderCount(phone: string): Promise<number> {
    const normalized = phone.replace(/\D/g, "");
    return this.getOrders().filter((order) =>
      order.customerPhone.replace(/\D/g, "").includes(normalized),
    ).length;
  }

  async markAllSeen(storeId: string): Promise<void> {
    const now = new Date().toISOString();
    const orders = this.getOrders();
    let changed = false;

    for (let i = 0; i < orders.length; i++) {
      if (orders[i].storeId === storeId && !orders[i].vendorSeenAt) {
        orders[i] = { ...orders[i], vendorSeenAt: now };
        changed = true;
      }
    }

    if (changed) {
      this.saveOrders(orders);
    }
  }

  async getUnreadCount(storeId: string): Promise<number> {
    return this.getOrders().filter(
      (order) => order.storeId === storeId && !order.vendorSeenAt,
    ).length;
  }

  async trackAbandonedCart(): Promise<void> {
    // No-op in local mode
  }
}

export const orderRepository: OrderRepository = new LocalOrderRepository();

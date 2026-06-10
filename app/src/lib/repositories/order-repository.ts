import type {
  CheckoutInput,
  CheckoutResult,
  CustomerOrder,
  CustomerOrderInput,
  OrderReceipt,
  OrderStatus,
} from "@/types/orders";

export interface OrderRepository {
  create(input: CustomerOrderInput): Promise<CustomerOrder>;
  checkout(input: CheckoutInput): Promise<CheckoutResult>;
  reserve(input: Omit<CheckoutInput, "storeSlug">): Promise<CustomerOrder>;
  verifyPayment(paymentRef: string): Promise<CustomerOrder>;
  getReceipt(paymentRef: string): Promise<OrderReceipt>;
  markTransferReference(
    paymentRef: string,
    transferReference: string,
  ): Promise<CustomerOrder>;
  listByStoreId(storeId: string, query?: string): Promise<CustomerOrder[]>;
  getByPaymentRef(paymentRef: string): Promise<CustomerOrder | null>;
  updateStatus(orderId: string, status: OrderStatus): Promise<CustomerOrder>;
  bulkUpdateStatus(
    orderIds: string[],
    status: OrderStatus,
  ): Promise<CustomerOrder[]>;
  getCustomerOrderCount(phone: string): Promise<number>;
  markAllSeen(storeId: string): Promise<void>;
  getUnreadCount(storeId: string): Promise<number>;
  trackAbandonedCart(input: {
    storeId: string;
    productId: string;
    customerPhone?: string;
    customerName?: string;
    cartData: Record<string, unknown>;
  }): Promise<void>;
}

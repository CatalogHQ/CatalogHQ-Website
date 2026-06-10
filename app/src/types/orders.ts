import type { DeliveryTypeId } from "@/lib/delivery-types";

export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderStatus =
  | "reserved"
  | "paid"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type CustomerOrder = {
  id: string;
  paymentRef: string;
  storeId: string;
  productId: string;
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
  deliveryType: DeliveryTypeId;
  unitPrice: number;
  deliveryFee?: number;
  discountAmount?: number;
  discountCode?: string;
  totalPaid: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paystackReference?: string;
  transferReference?: string;
  reservedUntil?: string;
  internalNotes?: string;
  estimatedDeliveryAt?: string;
  riderName?: string;
  riderPhone?: string;
  vendorSeenAt?: string;
  createdAt: string;
};

export type CustomerOrderInput = Omit<
  CustomerOrder,
  | "id"
  | "paymentRef"
  | "status"
  | "createdAt"
  | "vendorSeenAt"
  | "unitPrice"
  | "totalPaid"
>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  reserved: "Reserved",
  paid: "Paid",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "paid",
  "confirmed",
  "shipped",
  "delivered",
];

export type CheckoutInput = CustomerOrderInput & {
  storeSlug: string;
  deliveryZoneId?: string;
  discountCode?: string;
};

export type CheckoutPayment = {
  mock: boolean;
  authorizationUrl: string | null;
  reference: string;
  publicKey?: string;
};

export type CheckoutResult = {
  order: CustomerOrder;
  payment: CheckoutPayment;
};

export type OrderReceipt = {
  valid: boolean;
  order: CustomerOrder;
  verifyUrl: string;
};

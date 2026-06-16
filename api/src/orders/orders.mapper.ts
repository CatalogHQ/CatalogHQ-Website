import { Order, OrderStatus, PaymentStatus, PayoutStatus, VendorPayout } from '@prisma/client';

export type OrderDto = {
  id: string;
  paymentRef: string;
  storeId: string;
  productId: string;
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
  deliveryType: string;
  unitPrice: number;
  deliveryFee: number;
  discountAmount: number;
  discountCode?: string;
  totalPaid: number;
  vendorNet: number;
  platformFee: number;
  payoutStatus: PayoutStatus;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  gatewayReference?: string;
  transferReference?: string;
  reservedUntil?: string;
  internalNotes?: string;
  estimatedDeliveryAt?: string;
  riderName?: string;
  riderPhone?: string;
  vendorSeenAt?: string;
  payoutSettledAt?: string;
  vendorPayoutSeenAt?: string;
  createdAt: string;
};

export type PublicOrderDto = Omit<
  OrderDto,
  | 'internalNotes'
  | 'vendorNet'
  | 'riderPhone'
  | 'vendorSeenAt'
  | 'gatewayReference'
>;

export function toPublicOrderDto(order: Order): PublicOrderDto {
  const full = toOrderDto(order);
  const {
    internalNotes: _internalNotes,
    vendorNet: _vendorNet,
    riderPhone: _riderPhone,
    vendorSeenAt: _vendorSeenAt,
    gatewayReference: _gatewayReference,
    ...publicOrder
  } = full;
  return publicOrder;
}

export function toOrderDto(order: Order): OrderDto {
  return {
    id: order.id,
    paymentRef: order.paymentRef,
    storeId: order.storeId,
    productId: order.productId,
    productName: order.productName,
    color: order.color ?? undefined,
    size: order.size ?? undefined,
    quantity: order.quantity,
    deliveryType: order.deliveryType,
    unitPrice: order.unitPrice,
    deliveryFee: order.deliveryFee,
    discountAmount: order.discountAmount,
    discountCode: order.discountCode ?? undefined,
    totalPaid: order.totalPaid,
    vendorNet: order.vendorNet,
    platformFee: order.platformFee,
    payoutStatus: order.payoutStatus,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress ?? undefined,
    status: order.status,
    paymentStatus: order.paymentStatus,
    gatewayReference: order.gatewayReference ?? undefined,
    transferReference: order.transferReference ?? undefined,
    reservedUntil: order.reservedUntil?.toISOString(),
    internalNotes: order.internalNotes ?? undefined,
    estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString(),
    riderName: order.riderName ?? undefined,
    riderPhone: order.riderPhone ?? undefined,
    vendorSeenAt: order.vendorSeenAt?.toISOString(),
    payoutSettledAt: order.payoutSettledAt?.toISOString(),
    vendorPayoutSeenAt: order.vendorPayoutSeenAt?.toISOString(),
    createdAt: order.createdAt.toISOString(),
  };
}

export function toOrderDtoFromPayoutRecord(
  order: Order,
  payout: VendorPayout,
): OrderDto {
  const dto = toOrderDto(order);
  return {
    ...dto,
    vendorNet: payout.amountNaira,
    platformFee: payout.platformFeeNaira,
    payoutStatus: payout.status,
    payoutSettledAt: payout.settledAt?.toISOString() ?? dto.payoutSettledAt,
    vendorPayoutSeenAt: payout.vendorSeenAt?.toISOString() ?? dto.vendorPayoutSeenAt,
    createdAt: payout.createdAt.toISOString(),
  };
}

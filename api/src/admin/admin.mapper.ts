import {
  Order,
  OrderStatus,
  PaymentStatus,
  PlanTier,
  PayoutStatus,
  Store,
  SubscriptionPayment,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
  SupportTicket,
  User,
  VendorPayout,
  VendorPayoutMethod,
  VendorVerificationStatus,
} from '@prisma/client';
import { decryptNIN, isEncryptedNIN, maskNIN } from '../lib/encryption';

function maskStoredNin(nin: string): string {
  try {
    const plain = isEncryptedNIN(nin) ? decryptNIN(nin) : nin;
    return maskNIN(plain);
  } catch {
    return '****';
  }
}

export type AdminVendorDto = {
  id: string;
  email: string;
  phone: string;
  planTier: PlanTier;
  subscriptionStatus?: string;
  subscriptionExempt: boolean;
  createdAt: string;
  businessName: string;
  slug: string;
  verificationStatus: VendorVerificationStatus;
  setupComplete: boolean;
  orderCount: number;
  revenue: number;
  city?: string;
  state?: string;
};

export type AdminCustomerDto = {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

export type AdminPlatformOrderDto = {
  id: string;
  paymentRef: string;
  storeName: string;
  storeSlug: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
  deliveryType: string;
  deliveryAddress?: string;
  discountAmount: number;
  discountCode?: string;
  totalPaid: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  gatewayReference?: string;
  transferReference?: string;
  createdAt: string;
};

export type AdminSupportTicketDto = {
  id: string;
  subject: string;
  description: string;
  type: SupportTicket['type'];
  status: SupportTicket['status'];
  priority: SupportTicket['priority'];
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  storeName?: string;
  orderRef?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminVerificationRequestDto = {
  id: string;
  vendorId: string;
  businessName: string;
  slug: string;
  ninMasked: string;
  legalFirstName?: string;
  legalLastName?: string;
  submittedAt: string;
  city?: string;
  state?: string;
};

export type AdminPlatformStatsDto = {
  totalVendors: number;
  activeStores: number;
  totalCustomers: number;
  totalOrders: number;
  platformGmv: number;
  subscriptionMrr: number;
  openTickets: number;
  pendingVerifications: number;
  pendingPayments: number;
  failedPayments: number;
};

export type AdminPlanDistributionDto = {
  tier: PlanTier;
  count: number;
}[];

export type AdminRevenueByDayDto = {
  label: string;
  date: string;
  revenue: number;
};

export type AdminBadgesDto = {
  pendingVerifications: number;
  openTickets: number;
};

export type AdminSubscriptionPaymentDto = {
  id: string;
  vendorId: string;
  vendorEmail: string;
  storeName: string;
  storeSlug: string;
  planTier: PlanTier;
  amountNaira: number;
  currency: string;
  reference: string;
  status: SubscriptionPaymentStatus;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExempt: boolean;
  paystackSubscriptionCode?: string;
  paidAt?: string;
  createdAt: string;
};

export type AdminPlatformPayoutDto = {
  id: string;
  orderId: string;
  paymentRef: string;
  storeName: string;
  storeSlug: string;
  amountNaira: number;
  platformFeeNaira: number;
  method: VendorPayoutMethod;
  status: PayoutStatus;
  bankName?: string;
  accountNumberLast4?: string;
  failureReason?: string;
  flutterwaveReference?: string;
  createdAt: string;
  initiatedAt?: string;
  settledAt?: string;
  failedAt?: string;
};

type StoreWithVendor = Store & {
  vendor: User & { subscription?: { status: string } | null };
};

export function toAdminVendorDto(
  store: StoreWithVendor,
  orderCount: number,
  revenue: number,
): AdminVendorDto {
  return {
    id: store.vendorId,
    email: store.vendor.email,
    phone: store.whatsapp,
    planTier: store.vendor.planTier,
    subscriptionStatus: store.vendor.subscription?.status,
    subscriptionExempt: store.vendor.subscriptionExempt,
    createdAt: store.vendor.createdAt.toISOString(),
    businessName: store.businessName,
    slug: store.slug,
    verificationStatus: store.verificationStatus,
    setupComplete: store.setupComplete,
    orderCount,
    revenue,
    city: store.city ?? undefined,
    state: store.state ?? undefined,
  };
}

export function toAdminPlatformOrderDto(
  order: Order,
  store: Pick<Store, 'businessName' | 'slug'>,
): AdminPlatformOrderDto {
  return {
    id: order.id,
    paymentRef: order.paymentRef,
    storeName: store.businessName,
    storeSlug: store.slug,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    productName: order.productName,
    color: order.color ?? undefined,
    size: order.size ?? undefined,
    quantity: order.quantity,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress ?? undefined,
    discountAmount: order.discountAmount,
    discountCode: order.discountCode ?? undefined,
    totalPaid: order.totalPaid,
    status: order.status,
    paymentStatus: order.paymentStatus,
    gatewayReference: order.gatewayReference ?? undefined,
    transferReference: order.transferReference ?? undefined,
    createdAt: order.createdAt.toISOString(),
  };
}

export function toAdminTicketDto(ticket: SupportTicket): AdminSupportTicketDto {
  return {
    id: ticket.id,
    subject: ticket.subject,
    description: ticket.description,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    contactName: ticket.contactName,
    contactPhone: ticket.contactPhone,
    contactEmail: ticket.contactEmail ?? undefined,
    storeName: ticket.storeName ?? undefined,
    orderRef: ticket.orderRef ?? undefined,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function toAdminSubscriptionPaymentDto(
  payment: SubscriptionPayment & {
    vendor: Pick<User, 'email' | 'subscriptionExempt'> & {
      store: Pick<Store, 'businessName' | 'slug'> | null;
      subscription: { status: SubscriptionStatus; paystackSubscriptionCode: string | null } | null;
    };
  },
): AdminSubscriptionPaymentDto {
  return {
    id: payment.id,
    vendorId: payment.vendorId,
    vendorEmail: payment.vendor.email,
    storeName: payment.vendor.store?.businessName ?? '—',
    storeSlug: payment.vendor.store?.slug ?? '',
    planTier: payment.planTier,
    amountNaira: Math.round(payment.amountKobo / 100),
    currency: payment.currency,
    reference: payment.flutterwaveReference,
    status: payment.status,
    subscriptionStatus: payment.vendor.subscription?.status,
    subscriptionExempt: payment.vendor.subscriptionExempt,
    paystackSubscriptionCode:
      payment.vendor.subscription?.paystackSubscriptionCode ?? undefined,
    paidAt: payment.paidAt?.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

export function toAdminPlatformPayoutDto(
  payout: VendorPayout & {
    order: Pick<Order, 'paymentRef'>;
    store: Pick<Store, 'businessName' | 'slug'>;
  },
): AdminPlatformPayoutDto {
  return {
    id: payout.id,
    orderId: payout.orderId,
    paymentRef: payout.order.paymentRef,
    storeName: payout.store.businessName,
    storeSlug: payout.store.slug,
    amountNaira: payout.amountNaira,
    platformFeeNaira: payout.platformFeeNaira,
    method: payout.method,
    status: payout.status,
    bankName: payout.bankName ?? undefined,
    accountNumberLast4: payout.accountNumberLast4 ?? undefined,
    failureReason: payout.failureReason ?? undefined,
    flutterwaveReference: payout.flutterwaveReference ?? undefined,
    createdAt: payout.createdAt.toISOString(),
    initiatedAt: payout.initiatedAt?.toISOString(),
    settledAt: payout.settledAt?.toISOString(),
    failedAt: payout.failedAt?.toISOString(),
  };
}

export function toAdminVerificationDto(store: Store): AdminVerificationRequestDto {
  return {
    id: store.vendorId,
    vendorId: store.vendorId,
    businessName: store.businessName,
    slug: store.slug,
    ninMasked: maskStoredNin(store.nin),
    legalFirstName: store.legalFirstName ?? undefined,
    legalLastName: store.legalLastName ?? undefined,
    submittedAt: store.verificationSubmittedAt?.toISOString() ?? new Date().toISOString(),
    city: store.city ?? undefined,
    state: store.state ?? undefined,
  };
}

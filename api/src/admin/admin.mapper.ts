import {
  Order,
  OrderStatus,
  PaymentStatus,
  PlanTier,
  Store,
  SupportTicket,
  User,
  VendorVerificationStatus,
} from '@prisma/client';
import { maskNin } from '../common/mask.util';

export type AdminVendorDto = {
  id: string;
  email: string;
  phone: string;
  planTier: PlanTier;
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

type StoreWithVendor = Store & { vendor: User };

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

export function toAdminVerificationDto(store: Store): AdminVerificationRequestDto {
  return {
    id: store.vendorId,
    vendorId: store.vendorId,
    businessName: store.businessName,
    slug: store.slug,
    ninMasked: maskNin(store.nin),
    legalFirstName: store.legalFirstName ?? undefined,
    legalLastName: store.legalLastName ?? undefined,
    submittedAt: store.verificationSubmittedAt?.toISOString() ?? new Date().toISOString(),
    city: store.city ?? undefined,
    state: store.state ?? undefined,
  };
}

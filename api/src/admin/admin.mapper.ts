import {
  Order,
  OrderStatus,
  PlanTier,
  Store,
  SupportTicket,
  User,
  VendorVerificationStatus,
} from '@prisma/client';
import { maskNin } from '../common/mask.util';

export type AdminVendorDto = {
  id: string;
  phone: string;
  planTier: PlanTier;
  createdAt: string;
  businessName: string;
  slug: string;
  verificationStatus: VendorVerificationStatus;
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
  totalPaid: number;
  status: OrderStatus;
  createdAt: string;
};

export type AdminSupportTicketDto = {
  id: string;
  subject: string;
  type: SupportTicket['type'];
  status: SupportTicket['status'];
  priority: SupportTicket['priority'];
  storeName?: string;
  orderRef?: string;
  createdAt: string;
};

export type AdminVerificationRequestDto = {
  id: string;
  vendorId: string;
  businessName: string;
  slug: string;
  ninMasked: string;
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
  openTickets: number;
  pendingVerifications: number;
};

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
    phone: store.whatsapp,
    planTier: store.vendor.planTier,
    createdAt: store.vendor.createdAt.toISOString(),
    businessName: store.businessName,
    slug: store.slug,
    verificationStatus: store.verificationStatus,
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
    totalPaid: order.totalPaid,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  };
}

export function toAdminTicketDto(ticket: SupportTicket): AdminSupportTicketDto {
  return {
    id: ticket.id,
    subject: ticket.subject,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    storeName: ticket.storeName ?? undefined,
    orderRef: ticket.orderRef ?? undefined,
    createdAt: ticket.createdAt.toISOString(),
  };
}

export function toAdminVerificationDto(store: Store): AdminVerificationRequestDto {
  return {
    id: store.vendorId,
    vendorId: store.vendorId,
    businessName: store.businessName,
    slug: store.slug,
    ninMasked: maskNin(store.nin),
    submittedAt: store.verificationSubmittedAt?.toISOString() ?? new Date().toISOString(),
    city: store.city ?? undefined,
    state: store.state ?? undefined,
  };
}

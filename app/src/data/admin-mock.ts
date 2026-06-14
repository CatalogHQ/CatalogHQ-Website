import type { PlanTier } from "@/data/plans";
import type { VendorVerificationStatus } from "@/types/domain";
import type { OrderStatus, PaymentStatus } from "@/types/orders";

export type AdminVendor = {
  id: string;
  email: string;
  phone: string;
  planTier: PlanTier;
  subscriptionStatus?: string;
  subscriptionExempt?: boolean;
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

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

export type AdminPlatformOrder = {
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

export type AdminTicketStatus = "open" | "in_progress" | "resolved";
export type AdminTicketType = "vendor" | "customer";
export type AdminTicketPriority = "low" | "medium" | "high";

export type AdminSupportTicket = {
  id: string;
  subject: string;
  description: string;
  type: AdminTicketType;
  status: AdminTicketStatus;
  priority: AdminTicketPriority;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  storeName?: string;
  orderRef?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminVerificationRequest = {
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

export type AdminPlatformStats = {
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

export type AdminPlanDistribution = {
  tier: PlanTier;
  count: number;
}[];

export type AdminRevenueByDay = {
  label: string;
  date: string;
  revenue: number;
};

export const ADMIN_MOCK_VENDORS: AdminVendor[] = [
  {
    id: "v1",
    email: "hello@lagosfabrics.ng",
    phone: "08031234567",
    planTier: "pro",
    createdAt: "2025-11-02T10:00:00.000Z",
    businessName: "Lagos Fabrics Co.",
    slug: "lagos-fabrics",
    verificationStatus: "verified",
    setupComplete: true,
    orderCount: 48,
    revenue: 1_240_000,
    city: "Lagos",
    state: "Lagos",
  },
  {
    id: "v2",
    email: "contact@abujasneakers.ng",
    phone: "08123456789",
    planTier: "starter",
    createdAt: "2025-12-15T14:30:00.000Z",
    businessName: "Abuja Sneaker Hub",
    slug: "abuja-sneaker-hub",
    verificationStatus: "pending",
    setupComplete: true,
    orderCount: 12,
    revenue: 385_000,
    city: "Abuja",
    state: "FCT",
  },
  {
    id: "v3",
    email: "shop@phbeauty.ng",
    phone: "07087654321",
    planTier: "pro",
    createdAt: "2026-01-08T09:15:00.000Z",
    businessName: "Port Harcourt Beauty",
    slug: "ph-beauty",
    verificationStatus: "verified",
    setupComplete: true,
    orderCount: 31,
    revenue: 892_500,
    city: "Port Harcourt",
    state: "Rivers",
  },
  {
    id: "v4",
    email: "info@ibadanhome.ng",
    phone: "09011223344",
    planTier: "starter",
    createdAt: "2026-02-20T16:45:00.000Z",
    businessName: "Ibadan Home Goods",
    slug: "ibadan-home-goods",
    verificationStatus: "pending",
    setupComplete: true,
    orderCount: 5,
    revenue: 127_000,
    city: "Ibadan",
    state: "Oyo",
  },
  {
    id: "v5",
    email: "kano@tailoring.ng",
    phone: "08099887766",
    planTier: "starter",
    createdAt: "2026-03-01T11:20:00.000Z",
    businessName: "Kano Tailoring",
    slug: "kano-tailoring",
    verificationStatus: "rejected",
    setupComplete: false,
    orderCount: 0,
    revenue: 0,
    city: "Kano",
    state: "Kano",
  },
  {
    id: "v6",
    email: "enugu@electronics.ng",
    phone: "08155667788",
    planTier: "pro",
    createdAt: "2026-03-10T08:00:00.000Z",
    businessName: "Enugu Electronics",
    slug: "enugu-electronics",
    verificationStatus: "unsubmitted",
    setupComplete: false,
    orderCount: 0,
    revenue: 0,
    city: "Enugu",
    state: "Enugu",
  },
];

export const ADMIN_MOCK_CUSTOMERS: AdminCustomer[] = [
  {
    id: "c1",
    name: "Chioma Okonkwo",
    phone: "08012345678",
    orderCount: 4,
    totalSpent: 185_000,
    lastOrderAt: "2026-06-05T14:22:00.000Z",
  },
  {
    id: "c2",
    name: "Emeka Nwosu",
    phone: "08198765432",
    orderCount: 2,
    totalSpent: 67_500,
    lastOrderAt: "2026-06-04T09:10:00.000Z",
  },
  {
    id: "c3",
    name: "Fatima Bello",
    phone: "07034567890",
    orderCount: 6,
    totalSpent: 312_000,
    lastOrderAt: "2026-06-06T11:45:00.000Z",
  },
  {
    id: "c4",
    name: "Tunde Adeyemi",
    phone: "09087654321",
    orderCount: 1,
    totalSpent: 45_000,
    lastOrderAt: "2026-06-03T16:30:00.000Z",
  },
  {
    id: "c5",
    name: "Amina Yusuf",
    phone: "08056781234",
    orderCount: 3,
    totalSpent: 98_500,
    lastOrderAt: "2026-06-02T10:15:00.000Z",
  },
];

export const ADMIN_MOCK_ORDERS: AdminPlatformOrder[] = [
  {
    id: "o1",
    paymentRef: "SHP-20260606-A3F2",
    storeName: "Lagos Fabrics Co.",
    storeSlug: "lagos-fabrics",
    customerName: "Fatima Bello",
    customerPhone: "07034567890",
    productName: "Ankara Print Bundle",
    quantity: 1,
    deliveryType: "delivery",
    deliveryAddress: "12 Allen Ave, Ikeja, Lagos",
    discountAmount: 0,
    totalPaid: 52_000,
    status: "paid",
    paymentStatus: "paid",
    gatewayReference: "flw-o1-paid",
    createdAt: "2026-06-06T11:45:00.000Z",
  },
  {
    id: "o2",
    paymentRef: "SHP-20260605-B7C1",
    storeName: "Lagos Fabrics Co.",
    storeSlug: "lagos-fabrics",
    customerName: "Chioma Okonkwo",
    customerPhone: "08012345678",
    productName: "Lace Material (6 yards)",
    quantity: 1,
    deliveryType: "pickup",
    discountAmount: 0,
    totalPaid: 38_500,
    status: "confirmed",
    paymentStatus: "paid",
    gatewayReference: "flw-o2-paid",
    createdAt: "2026-06-05T14:22:00.000Z",
  },
  {
    id: "o3",
    paymentRef: "SHP-20260605-D4E8",
    storeName: "Port Harcourt Beauty",
    storeSlug: "ph-beauty",
    customerName: "Chioma Okonkwo",
    customerPhone: "08012345678",
    productName: "Skincare Gift Set",
    quantity: 1,
    deliveryType: "delivery",
    discountAmount: 0,
    totalPaid: 24_000,
    status: "shipped",
    paymentStatus: "paid",
    createdAt: "2026-06-05T10:08:00.000Z",
  },
  {
    id: "o4",
    paymentRef: "SHP-20260604-F1A9",
    storeName: "Abuja Sneaker Hub",
    storeSlug: "abuja-sneaker-hub",
    customerName: "Emeka Nwosu",
    customerPhone: "08198765432",
    productName: "Air Max Replica",
    quantity: 1,
    deliveryType: "pickup",
    discountAmount: 0,
    totalPaid: 35_000,
    status: "delivered",
    paymentStatus: "paid",
    createdAt: "2026-06-04T09:10:00.000Z",
  },
  {
    id: "o5",
    paymentRef: "SHP-20260603-G2H3",
    storeName: "Ibadan Home Goods",
    storeSlug: "ibadan-home-goods",
    customerName: "Tunde Adeyemi",
    customerPhone: "09087654321",
    productName: "Ceramic Dinner Set",
    quantity: 1,
    deliveryType: "delivery",
    discountAmount: 0,
    totalPaid: 45_000,
    status: "reserved",
    paymentStatus: "pending",
    gatewayReference: "flw-o5-pending",
    createdAt: "2026-06-03T16:30:00.000Z",
  },
  {
    id: "o6",
    paymentRef: "SHP-20260602-I4J5",
    storeName: "Port Harcourt Beauty",
    storeSlug: "ph-beauty",
    customerName: "Amina Yusuf",
    customerPhone: "08056781234",
    productName: "Hair Growth Oil",
    quantity: 1,
    deliveryType: "pickup",
    discountAmount: 0,
    totalPaid: 12_500,
    status: "cancelled",
    paymentStatus: "failed",
    gatewayReference: "flw-o6-failed",
    createdAt: "2026-06-02T10:15:00.000Z",
  },
  {
    id: "o7",
    paymentRef: "SHP-20260601-K6L7",
    storeName: "Lagos Fabrics Co.",
    storeSlug: "lagos-fabrics",
    customerName: "Fatima Bello",
    customerPhone: "07034567890",
    productName: "Adire Fabric",
    quantity: 2,
    deliveryType: "delivery",
    discountAmount: 0,
    totalPaid: 28_000,
    status: "delivered",
    paymentStatus: "paid",
    createdAt: "2026-06-01T13:40:00.000Z",
  },
];

export const ADMIN_MOCK_TICKETS: AdminSupportTicket[] = [
  {
    id: "t1",
    subject: "Payment not reflecting on order",
    description:
      "I paid via bank transfer 2 hours ago but the order still shows pending. My ref is SHP-20260604-F1A9.",
    type: "customer",
    status: "open",
    priority: "high",
    contactName: "Emeka Nwosu",
    contactPhone: "08198765432",
    contactEmail: "emeka@example.com",
    storeName: "Abuja Sneaker Hub",
    orderRef: "SHP-20260604-F1A9",
    createdAt: "2026-06-06T08:30:00.000Z",
    updatedAt: "2026-06-06T08:30:00.000Z",
  },
  {
    id: "t2",
    subject: "Need help upgrading to Pro plan",
    description:
      "How do I upgrade from Starter to Pro? I want analytics and more products.",
    type: "vendor",
    status: "open",
    priority: "medium",
    contactName: "Tunde Adeyemi",
    contactPhone: "09087654321",
    storeName: "Ibadan Home Goods",
    createdAt: "2026-06-05T15:00:00.000Z",
    updatedAt: "2026-06-05T15:00:00.000Z",
  },
  {
    id: "t3",
    subject: "Store verification taking too long",
    description: "Submitted NIN 5 days ago. Store still shows pending verification.",
    type: "vendor",
    status: "in_progress",
    priority: "medium",
    contactName: "Abuja Sneaker Hub",
    contactPhone: "08123456789",
    storeName: "Abuja Sneaker Hub",
    createdAt: "2026-06-04T11:20:00.000Z",
    updatedAt: "2026-06-05T09:00:00.000Z",
  },
  {
    id: "t4",
    subject: "Wrong item delivered",
    description: "Ordered lace material but received ankara print instead.",
    type: "customer",
    status: "in_progress",
    priority: "high",
    contactName: "Chioma Okonkwo",
    contactPhone: "08012345678",
    storeName: "Lagos Fabrics Co.",
    orderRef: "SHP-20260605-B7C1",
    createdAt: "2026-06-03T17:45:00.000Z",
    updatedAt: "2026-06-04T10:00:00.000Z",
  },
  {
    id: "t5",
    subject: "How to add product variants?",
    description: "Need help setting up size and color options for my products.",
    type: "vendor",
    status: "resolved",
    priority: "low",
    contactName: "PH Beauty",
    contactPhone: "07087654321",
    storeName: "Port Harcourt Beauty",
    createdAt: "2026-05-28T09:00:00.000Z",
    updatedAt: "2026-05-29T14:00:00.000Z",
  },
];

export const ADMIN_MOCK_VERIFICATION_QUEUE: AdminVerificationRequest[] = [
  {
    id: "vr1",
    vendorId: "v2",
    businessName: "Abuja Sneaker Hub",
    slug: "abuja-sneaker-hub",
    ninMasked: "1234****5678",
    legalFirstName: "Chidi",
    legalLastName: "Okafor",
    submittedAt: "2025-12-16T10:00:00.000Z",
    city: "Abuja",
    state: "FCT",
  },
  {
    id: "vr2",
    vendorId: "v4",
    businessName: "Ibadan Home Goods",
    slug: "ibadan-home-goods",
    ninMasked: "9876****4321",
    legalFirstName: "Funke",
    legalLastName: "Adebayo",
    submittedAt: "2026-02-21T08:30:00.000Z",
    city: "Ibadan",
    state: "Oyo",
  },
];

export const ADMIN_MOCK_REVENUE_BY_DAY: AdminRevenueByDay[] = [
  { label: "Jun 1", date: "2026-06-01", revenue: 142_000 },
  { label: "Jun 2", date: "2026-06-02", revenue: 98_500 },
  { label: "Jun 3", date: "2026-06-03", revenue: 175_000 },
  { label: "Jun 4", date: "2026-06-04", revenue: 210_500 },
  { label: "Jun 5", date: "2026-06-05", revenue: 186_000 },
  { label: "Jun 6", date: "2026-06-06", revenue: 124_500 },
  { label: "Jun 7", date: "2026-06-07", revenue: 95_000 },
];

export const ADMIN_MOCK_STATS: AdminPlatformStats = {
  totalVendors: ADMIN_MOCK_VENDORS.length,
  activeStores: ADMIN_MOCK_VENDORS.filter((v) => v.orderCount > 0).length,
  totalCustomers: ADMIN_MOCK_CUSTOMERS.length,
  totalOrders: ADMIN_MOCK_ORDERS.length,
  platformGmv: ADMIN_MOCK_ORDERS.filter((o) => o.status !== "cancelled").reduce(
    (sum, o) => sum + o.totalPaid,
    0,
  ),
  subscriptionMrr: ADMIN_MOCK_VENDORS.reduce((sum, vendor) => {
    const monthlyPrice =
      vendor.planTier === "starter"
        ? 3_000
        : vendor.planTier === "pro"
          ? 5_000
          : vendor.planTier === "growth"
            ? 8_000
            : 15_000;
    return sum + monthlyPrice;
  }, 0),
  openTickets: ADMIN_MOCK_TICKETS.filter((t) => t.status === "open").length,
  pendingVerifications: ADMIN_MOCK_VERIFICATION_QUEUE.length,
  pendingPayments: ADMIN_MOCK_ORDERS.filter((o) => o.paymentStatus === "pending")
    .length,
  failedPayments: ADMIN_MOCK_ORDERS.filter((o) => o.paymentStatus === "failed")
    .length,
};

export const ADMIN_MOCK_PLAN_DISTRIBUTION: AdminPlanDistribution = [
  { tier: "starter", count: 3 },
  { tier: "pro", count: 2 },
  { tier: "growth", count: 0 },
  { tier: "business", count: 0 },
];

export function getPendingVerificationCount(): number {
  return ADMIN_MOCK_VERIFICATION_QUEUE.length;
}

export function getOpenTicketCount(): number {
  return ADMIN_MOCK_TICKETS.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;
}

export function getTopVendorsByRevenue(limit = 5): AdminVendor[] {
  return [...ADMIN_MOCK_VENDORS]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentStatus, PlanTier, VendorVerificationStatus } from '@prisma/client';
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VENDOR_VERIFICATION_DECIDED_EVENT } from './events/admin.events';
import { VendorVerificationDecidedEvent } from './events/vendor-verification-decided.event';
import {
  AdminBadgesDto,
  AdminCustomerDto,
  AdminPlanDistributionDto,
  AdminPlatformOrderDto,
  AdminPlatformStatsDto,
  AdminRevenueByDayDto,
  AdminSupportTicketDto,
  AdminVendorDto,
  AdminVerificationRequestDto,
  toAdminPlatformOrderDto,
  toAdminTicketDto,
  toAdminVendorDto,
  toAdminVerificationDto,
} from './admin.mapper';

type DatePreset = '7d' | '30d' | '90d' | 'month';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentsService: PaymentsService,
    private readonly planCatalogService: PlanCatalogService,
  ) {}

  private async getOrderAggregatesByStore(): Promise<
    Map<string, { orderCount: number; revenue: number }>
  > {
    const grouped = await this.prisma.order.groupBy({
      by: ['storeId'],
      where: { status: { not: OrderStatus.cancelled } },
      _count: { _all: true },
      _sum: { totalPaid: true },
    });

    const map = new Map<string, { orderCount: number; revenue: number }>();
    for (const entry of grouped) {
      map.set(entry.storeId, {
        orderCount: entry._count._all,
        revenue: entry._sum.totalPaid ?? 0,
      });
    }

    return map;
  }

  async getBadges(): Promise<AdminBadgesDto> {
    const [pendingVerifications, openTickets] = await Promise.all([
      this.prisma.store.count({
        where: { verificationStatus: VendorVerificationStatus.pending },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } },
      }),
    ]);

    return { pendingVerifications, openTickets };
  }

  private async computeSubscriptionMrr(): Promise<number> {
    const activeSubscriptions = await this.prisma.vendorSubscription.findMany({
      where: {
        status: { in: ['active', 'grace', 'past_due'] },
      },
      include: {
        vendor: { select: { subscriptionExempt: true } },
      },
    });

    const catalog = await this.planCatalogService.listAdminCatalog();
    const priceByTier = new Map(
      catalog.map((plan) => [plan.id, plan.monthlyPriceKobo]),
    );

    let mrrKobo = 0;
    for (const subscription of activeSubscriptions) {
      if (subscription.vendor.subscriptionExempt) {
        continue;
      }
      mrrKobo += priceByTier.get(subscription.planTier) ?? 0;
    }

    return Math.round(mrrKobo / 100);
  }

  async getStats(): Promise<AdminPlatformStatsDto> {
    const badges = await this.getBadges();
    const [
      totalVendors,
      orderStats,
      customers,
      activeStores,
      pendingPayments,
      failedPayments,
      subscriptionMrr,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'vendor' } }),
      this.prisma.order.aggregate({
        _count: { _all: true },
        _sum: { totalPaid: true },
        where: { status: { not: OrderStatus.cancelled } },
      }),
      this.prisma.order.groupBy({
        by: ['customerPhone'],
        where: { status: { not: OrderStatus.cancelled } },
      }),
      this.prisma.order.groupBy({
        by: ['storeId'],
        where: { status: { not: OrderStatus.cancelled } },
      }),
      this.prisma.order.count({
        where: { paymentStatus: PaymentStatus.pending },
      }),
      this.prisma.order.count({
        where: { paymentStatus: PaymentStatus.failed },
      }),
      this.computeSubscriptionMrr(),
    ]);

    return {
      totalVendors,
      activeStores: activeStores.length,
      totalCustomers: customers.length,
      totalOrders: orderStats._count._all,
      platformGmv: orderStats._sum.totalPaid ?? 0,
      subscriptionMrr,
      openTickets: badges.openTickets,
      pendingVerifications: badges.pendingVerifications,
      pendingPayments,
      failedPayments,
    };
  }

  async listVendors(): Promise<AdminVendorDto[]> {
    const [stores, aggregates] = await Promise.all([
      this.prisma.store.findMany({
        include: {
          vendor: {
            include: { subscription: true },
          },
        },
        orderBy: { vendor: { createdAt: 'desc' } },
      }),
      this.getOrderAggregatesByStore(),
    ]);

    return stores.map((store) => {
      const stats = aggregates.get(store.vendorId) ?? { orderCount: 0, revenue: 0 };
      return toAdminVendorDto(store, stats.orderCount, stats.revenue);
    });
  }

  async listCustomers(): Promise<AdminCustomerDto[]> {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerPhone'],
      where: { status: { not: OrderStatus.cancelled } },
      _count: { _all: true },
      _sum: { totalPaid: true },
      _max: { createdAt: true },
    });

    if (grouped.length === 0) {
      return [];
    }

    const latestOrders = await this.prisma.order.findMany({
      where: {
        customerPhone: { in: grouped.map((entry) => entry.customerPhone) },
        status: { not: OrderStatus.cancelled },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['customerPhone'],
      select: {
        customerPhone: true,
        customerName: true,
      },
    });

    const namesByPhone = new Map(
      latestOrders.map((order) => [order.customerPhone, order.customerName]),
    );

    return grouped
      .map((entry) => ({
        id: entry.customerPhone,
        name: namesByPhone.get(entry.customerPhone) ?? entry.customerPhone,
        phone: entry.customerPhone,
        orderCount: entry._count._all,
        totalSpent: entry._sum.totalPaid ?? 0,
        lastOrderAt: (entry._max.createdAt ?? new Date()).toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
      );
  }

  async listOrders(): Promise<AdminPlatformOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      include: { store: { select: { businessName: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => toAdminPlatformOrderDto(order, order.store));
  }

  async listTickets(): Promise<AdminSupportTicketDto[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map(toAdminTicketDto);
  }

  async getTicket(ticketId: string): Promise<AdminSupportTicketDto> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    return toAdminTicketDto(ticket);
  }

  async listVerificationQueue(): Promise<AdminVerificationRequestDto[]> {
    const stores = await this.prisma.store.findMany({
      where: { verificationStatus: VendorVerificationStatus.pending },
      orderBy: { verificationSubmittedAt: 'asc' },
    });

    return stores.map((store) => toAdminVerificationDto(store));
  }

  async approveVerification(vendorId: string): Promise<void> {
    const store = await this.prisma.store.findUnique({ where: { vendorId } });
    if (!store || store.verificationStatus !== VendorVerificationStatus.pending) {
      throw new NotFoundException('Verification request not found.');
    }

    await this.prisma.store.update({
      where: { vendorId },
      data: {
        verificationStatus: VendorVerificationStatus.verified,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });

    this.eventEmitter.emit(
      VENDOR_VERIFICATION_DECIDED_EVENT,
      new VendorVerificationDecidedEvent(vendorId, true),
    );
  }

  async rejectVerification(vendorId: string, reason?: string): Promise<void> {
    const store = await this.prisma.store.findUnique({ where: { vendorId } });
    if (!store || store.verificationStatus !== VendorVerificationStatus.pending) {
      throw new NotFoundException('Verification request not found.');
    }

    await this.prisma.store.update({
      where: { vendorId },
      data: {
        verificationStatus: VendorVerificationStatus.rejected,
        verifiedAt: null,
        rejectionReason: reason?.trim() || 'Verification rejected by admin.',
      },
    });

    this.eventEmitter.emit(
      VENDOR_VERIFICATION_DECIDED_EVENT,
      new VendorVerificationDecidedEvent(
        vendorId,
        false,
        reason?.trim() || 'Verification rejected by admin.',
      ),
    );
  }

  async getRevenueAnalytics(preset: DatePreset): Promise<AdminRevenueByDayDto[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (preset === 'month') {
      start.setDate(1);
    } else {
      const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
      start.setDate(start.getDate() - (days - 1));
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: { not: OrderStatus.cancelled },
        createdAt: { gte: start },
      },
      select: { createdAt: true, totalPaid: true },
    });

    if (preset === '7d' || preset === 'month') {
      return this.bucketDailyInRange(orders, start, new Date());
    }

    if (preset === '30d') {
      return this.bucketWeekly(orders, start);
    }

    return this.bucketMonthly(orders, start);
  }

  async getTopVendors(limit = 5): Promise<AdminVendorDto[]> {
    const aggregates = await this.prisma.order.groupBy({
      by: ['storeId'],
      where: { status: { not: OrderStatus.cancelled } },
      _count: { _all: true },
      _sum: { totalPaid: true },
      orderBy: { _sum: { totalPaid: 'desc' } },
      take: limit,
    });

    if (aggregates.length === 0) {
      return [];
    }

    const stores = await this.prisma.store.findMany({
      where: {
        vendorId: { in: aggregates.map((entry) => entry.storeId) },
      },
      include: { vendor: true },
    });

    const storeById = new Map(stores.map((store) => [store.vendorId, store]));

    return aggregates
      .map((entry) => {
        const store = storeById.get(entry.storeId);
        if (!store) return null;
        return toAdminVendorDto(
          store,
          entry._count._all,
          entry._sum.totalPaid ?? 0,
        );
      })
      .filter((vendor): vendor is AdminVendorDto => vendor !== null);
  }

  async getPlanDistribution(): Promise<AdminPlanDistributionDto> {
    const grouped = await this.prisma.user.groupBy({
      by: ['planTier'],
      where: { role: 'vendor' },
      _count: { _all: true },
    });

    const tiers: PlanTier[] = ['starter', 'pro', 'growth', 'business'];
    const counts = new Map(grouped.map((entry) => [entry.planTier, entry._count._all]));

    return tiers.map((tier) => ({
      tier,
      count: counts.get(tier) ?? 0,
    }));
  }

  async updateVendorPlan(vendorId: string, planTier: PlanTier): Promise<AdminVendorDto> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
      include: { vendor: true },
    });

    if (!store) {
      throw new NotFoundException('Vendor not found.');
    }

    await this.prisma.user.update({
      where: { id: vendorId },
      data: { planTier },
    });

    const aggregates = await this.getOrderAggregatesByStore();
    const stats = aggregates.get(vendorId) ?? { orderCount: 0, revenue: 0 };

    return toAdminVendorDto(
      { ...store, vendor: { ...store.vendor, planTier } },
      stats.orderCount,
      stats.revenue,
    );
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<AdminPlatformOrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { businessName: true, slug: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (
      status !== OrderStatus.cancelled &&
      order.paymentStatus !== PaymentStatus.paid
    ) {
      throw new BadRequestException('Order must be paid before fulfilment.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return toAdminPlatformOrderDto(updated, order.store);
  }

  async confirmOrderPayment(orderId: string): Promise<AdminPlatformOrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { businessName: true, slug: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.paymentStatus === PaymentStatus.paid) {
      return toAdminPlatformOrderDto(order, order.store);
    }

    if (!order.gatewayReference) {
      throw new BadRequestException('Order has no Flutterwave reference to verify.');
    }

    await this.paymentsService.confirmPayment(order.gatewayReference);

    const refreshed = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { store: { select: { businessName: true, slug: true } } },
    });

    return toAdminPlatformOrderDto(refreshed, refreshed.store);
  }

  private bucketDailyInRange(
    orders: { createdAt: Date; totalPaid: number }[],
    start: Date,
    end: Date,
  ): AdminRevenueByDayDto[] {
    const buckets = new Map<string, number>();
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (cursor <= endDay) {
      buckets.set(cursor.toISOString().slice(0, 10), 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + order.totalPaid);
      }
    }

    return [...buckets.entries()].map(([date, revenue]) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
      }),
      revenue,
    }));
  }

  private bucketWeekly(
    orders: { createdAt: Date; totalPaid: number }[],
    start: Date,
  ): AdminRevenueByDayDto[] {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const buckets: AdminRevenueByDayDto[] = [];

    for (let week = 0; week < 5; week += 1) {
      const weekStart = new Date(start.getTime() + week * weekMs);
      const weekEnd = new Date(weekStart.getTime() + weekMs);
      const revenue = orders
        .filter(
          (order) => order.createdAt >= weekStart && order.createdAt < weekEnd,
        )
        .reduce((sum, order) => sum + order.totalPaid, 0);

      buckets.push({
        date: weekStart.toISOString().slice(0, 10),
        label: `Week ${week + 1}`,
        revenue,
      });
    }

    return buckets;
  }

  private bucketMonthly(
    orders: { createdAt: Date; totalPaid: number }[],
    start: Date,
  ): AdminRevenueByDayDto[] {
    const buckets = new Map<string, number>();

    for (let month = 0; month < 3; month += 1) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + month);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, 0);
    }

    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + order.totalPaid);
      }
    }

    return [...buckets.entries()].map(([date, revenue], index) => ({
      date: `${date}-01`,
      label: `Month ${index + 1}`,
      revenue,
    }));
  }
}

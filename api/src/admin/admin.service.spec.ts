import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { VendorVerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const prisma = {
    order: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    store: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    supportTicket: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    vendorSubscription: {
      findMany: jest.fn(),
    },
  };

  const eventEmitter = { emit: jest.fn() };
  const paymentsService = { confirmPayment: jest.fn() };
  const planCatalogService = {
    listAdminCatalog: jest.fn(),
  };

  let service: AdminService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: PlanCatalogService, useValue: planCatalogService },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  it('aggregates platform stats from the database', async () => {
    prisma.store.count.mockResolvedValue(1);
    prisma.supportTicket.count.mockResolvedValue(2);
    prisma.user.count.mockResolvedValue(4);
    prisma.order.aggregate.mockResolvedValue({
      _count: { _all: 10 },
      _sum: { totalPaid: 50000 },
    });
    prisma.order.groupBy
      .mockResolvedValueOnce([{ customerPhone: '0801' }, { customerPhone: '0802' }])
      .mockResolvedValueOnce([{ storeId: 'store-1' }, { storeId: 'store-2' }]);
    prisma.order.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    planCatalogService.listAdminCatalog.mockResolvedValue([
      { id: 'starter', monthlyPriceKobo: 300_000 },
      { id: 'pro', monthlyPriceKobo: 500_000 },
    ]);
    prisma.vendorSubscription.findMany.mockResolvedValue([
      { planTier: 'starter', vendor: { subscriptionExempt: false } },
      { planTier: 'starter', vendor: { subscriptionExempt: false } },
      { planTier: 'pro', vendor: { subscriptionExempt: false } },
    ]);

    const stats = await service.getStats();

    expect(stats.totalVendors).toBe(4);
    expect(stats.totalOrders).toBe(10);
    expect(stats.platformGmv).toBe(50000);
    expect(stats.subscriptionMrr).toBe(11000);
    expect(stats.pendingPayments).toBe(3);
    expect(stats.failedPayments).toBe(1);
  });

  it('rejects verification for unknown vendor', async () => {
    prisma.store.findUnique.mockResolvedValue(null);

    await expect(
      service.rejectVerification('missing-vendor', 'Invalid NIN'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves verification and emits event', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.pending,
    });
    prisma.store.update.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
    });

    await service.approveVerification('vendor-1');

    expect(prisma.store.update).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalled();
  });
});

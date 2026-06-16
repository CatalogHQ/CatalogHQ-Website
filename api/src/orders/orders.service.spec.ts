import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  PlanTier,
} from '@prisma/client';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { PaymentsService } from '../payments/payments.service';
import { VendorPayoutRecordService } from '../payments/vendor-payout-record.service';
import { LowStockAlertService } from '../notifications/low-stock-alert.service';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { OrderAccessAttemptService } from './order-access-attempt.service';

describe('OrdersService', () => {
  const prisma = {
    store: { findUnique: jest.fn() },
    product: { findFirst: jest.fn(), updateMany: jest.fn() },
    discountCode: { findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
    order: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    activityLog: { create: jest.fn() },
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  const flutterwave = {
    isConfigured: jest.fn().mockReturnValue(false),
    initializeTransaction: jest.fn(),
  };

  const paymentsService = {
    confirmPayment: jest.fn().mockResolvedValue(undefined),
  };

  const planEntitlementService = {
    isStorePubliclyAvailable: jest.fn().mockResolvedValue(true),
    hasFeature: jest.fn().mockResolvedValue(true),
  };

  const lowStockAlertService = {
    notifyIfNeeded: jest.fn().mockResolvedValue(undefined),
  };

  const orderAccessAttempt = {
    assertCanAttempt: jest.fn().mockResolvedValue(undefined),
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    resetAttempts: jest.fn().mockResolvedValue(undefined),
  };

  const vendorPayoutRecords = {
    markAllSeen: jest.fn().mockResolvedValue(undefined),
    countUnreadSettled: jest.fn().mockResolvedValue(0),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      if (key === 'ALLOW_DEV_PAYMENT_MOCKS') return 'true';
      return undefined;
    }),
  };

  let service: OrdersService;

  const paidOrder = {
    id: 'order-1',
    paymentRef: 'SHP-TEST',
    storeId: 'store-1',
    productId: 'product-1',
    productName: 'Shirt',
    color: null,
    size: null,
    quantity: 2,
    deliveryType: 'pickup',
    unitPrice: 2500,
    deliveryFee: 0,
    discountAmount: 0,
    discountCode: null,
    totalPaid: 5122,
    vendorNet: 5000,
    platformFee: 20,
    payoutStatus: PayoutStatus.split,
    customerName: 'Ada',
    customerPhone: '08012345678',
    deliveryAddress: null,
    status: OrderStatus.paid,
    paymentStatus: PaymentStatus.paid,
    gatewayReference: 'flw-SHP-TEST',
    transferReference: null,
    reservedUntil: null,
    internalNotes: null,
    estimatedDeliveryAt: null,
    riderName: null,
    riderPhone: null,
    vendorSeenAt: null,
    createdAt: new Date('2026-06-08T10:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    flutterwave.isConfigured.mockReturnValue(false);
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: FlutterwaveService, useValue: flutterwave },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: VendorPayoutRecordService, useValue: vendorPayoutRecords },
        { provide: PlanEntitlementService, useValue: planEntitlementService },
        { provide: LowStockAlertService, useValue: lowStockAlertService },
        { provide: OrderAccessAttemptService, useValue: orderAccessAttempt },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('computes server-side pricing during create', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'store-1',
      slug: 'test-store',
      setupComplete: true,
      deliveryZones: [],
      vendor: { planTier: PlanTier.starter },
    });
    prisma.product.findFirst.mockResolvedValue({
      id: 'product-1',
      price: 2500,
      stock: 10,
      deliveryOptions: ['pickup'],
      published: true,
    });
    prisma.discountCode.findUnique.mockResolvedValue(null);
    prisma.order.create.mockResolvedValue({
      ...paidOrder,
      status: OrderStatus.reserved,
      paymentStatus: PaymentStatus.pending,
    });
    prisma.order.findUnique.mockResolvedValue(paidOrder);

    const result = await service.create({
      storeId: 'store-1',
      productId: 'product-1',
      productName: 'Shirt',
      quantity: 2,
      deliveryType: 'pickup',
      customerName: 'Ada',
      customerPhone: '08012345678',
      paymentMethod: 'bank_transfer',
    });

    expect(result.totalPaid).toBe(5122);
    expect(result.unitPrice).toBe(2500);
    expect(paymentsService.confirmPayment).toHaveBeenCalled();
  });

  it('rejects unavailable delivery types', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'store-1',
      slug: 'test-store',
      setupComplete: true,
      deliveryZones: [],
      vendor: { planTier: PlanTier.starter },
    });
    prisma.product.findFirst.mockResolvedValue({
      id: 'product-1',
      price: 2500,
      stock: 10,
      deliveryOptions: ['pickup'],
      published: true,
    });

    await expect(
      service.create({
        storeId: 'store-1',
        productId: 'product-1',
        productName: 'Shirt',
        quantity: 1,
        deliveryType: 'delivery',
        customerName: 'Ada',
        customerPhone: '08012345678',
        deliveryAddress: 'Lagos',
        paymentMethod: 'bank_transfer',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks checkout when payout setup is incomplete and Flutterwave is configured', async () => {
    flutterwave.isConfigured.mockReturnValue(true);
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'store-1',
      slug: 'test-store',
      setupComplete: true,
      payoutSetupComplete: false,
      deliveryZones: [],
      vendor: { planTier: PlanTier.starter },
    });
    prisma.product.findFirst.mockResolvedValue({
      id: 'product-1',
      price: 2500,
      stock: 10,
      deliveryOptions: ['pickup'],
      published: true,
    });

    await expect(
      service.create({
        storeId: 'store-1',
        productId: 'product-1',
        productName: 'Shirt',
        quantity: 1,
        deliveryType: 'pickup',
        customerName: 'Ada',
        customerPhone: '08012345678',
        paymentMethod: 'bank_transfer',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects status update when order belongs to another store', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStatus(
        'store-a',
        'order-b',
        OrderStatus.delivered,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('emits delivered event when status changes to delivered', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      storeId: 'store-1',
      status: OrderStatus.confirmed,
      paymentStatus: PaymentStatus.paid,
      customerPhone: '08012345678',
      paymentRef: 'SHP-TEST',
      store: { businessName: 'Test Store' },
    });
    prisma.order.update.mockResolvedValue({
      ...paidOrder,
      quantity: 1,
      totalPaid: 2500,
      status: OrderStatus.delivered,
    });

    await service.updateStatus('store-1', 'order-1', OrderStatus.delivered);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'order.delivered',
      expect.objectContaining({ orderId: 'order-1' }),
    );
  });
});

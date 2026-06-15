import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { OrderAccessAttemptService } from '../orders/order-access-attempt.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const prisma = {
    review: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
  };

  const storesService = {
    getPublicBySlug: jest.fn(),
  };

  const planEntitlementService = {
    hasFeature: jest.fn().mockResolvedValue(true),
  };

  const orderAccessAttempt = {
    assertCanAttempt: jest.fn().mockResolvedValue(undefined),
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    resetAttempts: jest.fn().mockResolvedValue(undefined),
  };

  let service: ReviewsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StoresService, useValue: storesService },
        { provide: PlanEntitlementService, useValue: planEntitlementService },
        { provide: OrderAccessAttemptService, useValue: orderAccessAttempt },
      ],
    }).compile();

    service = module.get(ReviewsService);
  });

  it('allows review status for paid fulfilled orders', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      storeId: 'store-1',
      customerPhone: '08012345678',
      paymentStatus: PaymentStatus.paid,
      status: OrderStatus.confirmed,
    });
    prisma.review.findUnique.mockResolvedValue(null);

    const status = await service.getOrderReviewStatus('SHP-123', '08012345678');

    expect(status.canReview).toBe(true);
    expect(status.alreadyReviewed).toBe(false);
  });

  it('creates a verified review linked to the order product', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      storeId: 'store-1',
      productName: 'Denim fit',
      customerPhone: '08012345678',
      paymentStatus: PaymentStatus.paid,
      status: OrderStatus.delivered,
    });
    prisma.review.findUnique.mockResolvedValue(null);
    prisma.review.create.mockResolvedValue({
      id: 'review-1',
      storeId: 'store-1',
      buyerName: 'Ada',
      rating: 5,
      comment: 'Great vendor experience overall.',
      productName: 'Denim fit',
      verified: true,
      createdAt: new Date('2026-06-14T10:00:00.000Z'),
      orderId: 'order-1',
    });

    const review = await service.createForOrder('SHP-123', {
      buyerName: 'Ada',
      customerPhone: '08012345678',
      rating: 5,
      comment: 'Great vendor experience overall.',
    });

    expect(review.productName).toBe('Denim fit');
    expect(review.verified).toBe(true);
  });

  it('rejects reviews for unpaid orders', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      storeId: 'store-1',
      productName: 'Denim fit',
      customerPhone: '08012345678',
      paymentStatus: PaymentStatus.pending,
      status: OrderStatus.reserved,
    });
    prisma.review.findUnique.mockResolvedValue(null);

    await expect(
      service.createForOrder('SHP-123', {
        buyerName: 'Ada',
        customerPhone: '08012345678',
        rating: 5,
        comment: 'Great vendor experience overall.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns already reviewed status', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      paymentStatus: PaymentStatus.paid,
      status: OrderStatus.delivered,
      customerPhone: '08012345678',
    });
    prisma.review.findUnique.mockResolvedValue({
      id: 'review-1',
      storeId: 'store-1',
      buyerName: 'Ada',
      rating: 5,
      comment: 'Great vendor experience overall.',
      productName: 'Denim fit',
      verified: true,
      createdAt: new Date('2026-06-14T10:00:00.000Z'),
      orderId: 'order-1',
    });

    const status = await service.getOrderReviewStatus('SHP-123', '08012345678');

    expect(status.alreadyReviewed).toBe(true);
    expect(status.canReview).toBe(false);
  });

  it('throws when order is missing', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(service.getOrderReviewStatus('SHP-123', '08012345678')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

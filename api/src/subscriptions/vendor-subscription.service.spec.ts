import { SubscriptionStatus } from '@prisma/client';
import { VendorSubscriptionService } from './vendor-subscription.service';

describe('VendorSubscriptionService', () => {
  const prisma = {
    subscriptionPayment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    vendorSubscription: {
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    planCatalogEntry: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const planCatalogService = {
    listPublicCatalog: jest.fn(),
    listAdminCatalog: jest.fn(),
  };

  const paystackSubscriptionService = {
    createDirectDebitCheckout: jest.fn(),
    cancelSubscription: jest.fn(),
    fetchSubscription: jest.fn(),
    verifySubscriptionPayment: jest.fn(),
  };

  const emailService = {
    sendEmail: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('2'),
  };

  const securityAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  let service: VendorSubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VendorSubscriptionService(
      prisma as never,
      planCatalogService as never,
      paystackSubscriptionService as never,
      emailService as never,
      configService as never,
      securityAudit as never,
    );
  });

  it('detects subscription payment references', () => {
    expect(service.isSubscriptionReference('sub_abc123')).toBe(true);
    expect(service.isSubscriptionReference('SHP-20260614-ABCD')).toBe(false);
  });

  it('skips duplicate subscription payment activation', async () => {
    prisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: 'pay-1',
      vendorId: 'vendor-1',
      planTier: 'starter',
      status: 'paid',
      amountKobo: 300000,
    });

    await service.activateFromPayment('sub_duplicate', {
      amountKobo: 300000,
      currency: 'NGN',
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects subscription activation when amount mismatches', async () => {
    prisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: 'pay-1',
      vendorId: 'vendor-1',
      planTier: 'starter',
      status: 'pending',
      amountKobo: 300000,
    });

    await service.activateFromPayment('sub_underpaid', {
      amountKobo: 100,
      currency: 'NGN',
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(securityAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'subscription.amount_mismatch',
      }),
    );
  });

  it('confirmCheckout verifies Paystack amount before activation', async () => {
    prisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: 'pay-1',
      vendorId: 'vendor-1',
      planTier: 'starter',
      status: 'pending',
      amountKobo: 300000,
    });
    paystackSubscriptionService.verifySubscriptionPayment.mockResolvedValue({
      successful: true,
      amountKobo: 300000,
      currency: 'NGN',
    });
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        subscriptionPayment: { update: jest.fn() },
        vendorSubscription: { upsert: jest.fn() },
        user: { update: jest.fn() },
      }),
    );
    prisma.user.findUnique.mockResolvedValue({
      id: 'vendor-1',
      planTier: 'starter',
      subscriptionExempt: false,
      subscription: {
        vendorId: 'vendor-1',
        status: 'active',
        planTier: 'starter',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        graceEndsAt: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        lastPaymentAt: new Date(),
        lastPaymentReference: 'sub_checkout_1',
      },
    });

    await service.confirmCheckout('vendor-1', 'sub_checkout_1');

    expect(paystackSubscriptionService.verifySubscriptionPayment).toHaveBeenCalledWith(
      'sub_checkout_1',
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('confirmCheckout rejects when Paystack amount is missing', async () => {
    prisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: 'pay-1',
      vendorId: 'vendor-1',
      planTier: 'starter',
      status: 'pending',
      amountKobo: 300000,
    });
    paystackSubscriptionService.verifySubscriptionPayment.mockResolvedValue({
      successful: true,
      amountKobo: undefined,
      currency: 'NGN',
    });

    await expect(
      service.confirmCheckout('vendor-1', 'sub_checkout_2'),
    ).rejects.toThrow('Could not verify subscription payment amount.');
  });

  it('expires grace subscriptions past graceEndsAt', async () => {
    prisma.vendorSubscription.findMany.mockResolvedValue([
      {
        vendorId: 'vendor-1',
        status: SubscriptionStatus.grace,
        vendor: { email: 'vendor@example.com' },
      },
    ]);

    const count = await service.expireGracePeriodSubscriptions();

    expect(count).toBe(1);
    expect(prisma.vendorSubscription.update).toHaveBeenCalledWith({
      where: { vendorId: 'vendor-1' },
      data: { status: SubscriptionStatus.expired },
    });
  });
});

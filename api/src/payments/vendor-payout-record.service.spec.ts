import { PaymentStatus, PayoutStatus, VendorPayoutMethod } from '@prisma/client';
import { VendorPayoutRecordService } from './vendor-payout-record.service';

describe('VendorPayoutRecordService', () => {
  const prisma = {
    order: { findUnique: jest.fn(), findFirst: jest.fn() },
    vendorPayout: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const service = new VendorPayoutRecordService(prisma as never);

  const paidOrder = {
    id: 'order-1',
    storeId: 'vendor-1',
    vendorNet: 8500,
    platformFee: 1500,
    paymentStatus: PaymentStatus.paid,
    store: {
      payoutBankCode: '044',
      payoutBankName: 'Access Bank',
      payoutAccountNumber: '0123456789',
      payoutAccountName: 'Ada Vendor',
      flutterwaveTransferRecipientId: 'rcb_vendor',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.order.findUnique.mockResolvedValue(paidOrder);
    prisma.vendorPayout.findUnique.mockResolvedValue(null);
    prisma.vendorPayout.upsert.mockResolvedValue({});
  });

  it('creates a pending payout record for a paid order', async () => {
    await service.ensureForPaidOrder('order-1', VendorPayoutMethod.instant_transfer);

    expect(prisma.vendorPayout.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'order-1' },
        create: expect.objectContaining({
          amountNaira: 8500,
          method: VendorPayoutMethod.instant_transfer,
          accountNumberLast4: '6789',
        }),
      }),
    );
  });

  it('records split settlement with bank snapshot', async () => {
    await service.recordSplitSettlement('order-1');

    expect(prisma.vendorPayout.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: PayoutStatus.split,
          method: VendorPayoutMethod.split,
          bankName: 'Access Bank',
        }),
      }),
    );
  });

  it('records instant transfer as settled when balance was confirmed', async () => {
    prisma.vendorPayout.findUnique.mockResolvedValue({ attemptCount: 0 });

    await service.recordInstantTransferSettled({
      orderId: 'order-1',
      transferId: 'trf_1',
      reference: 'po-order1',
      recipientId: 'rcb_vendor',
    });

    expect(prisma.vendorPayout.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: PayoutStatus.settled,
          attemptCount: 1,
          flutterwaveTransferId: 'trf_1',
          vendorSeenAt: null,
        }),
      }),
    );
  });

  it('records transfer initiation with attempt count', async () => {
    prisma.vendorPayout.findUnique.mockResolvedValue({ attemptCount: 1 });

    await service.recordTransferInitiated({
      orderId: 'order-1',
      transferId: 'trf_1',
      reference: 'po-order1',
      recipientId: 'rcb_vendor',
    });

    expect(prisma.vendorPayout.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: PayoutStatus.processing,
          attemptCount: 2,
          flutterwaveTransferId: 'trf_1',
        }),
      }),
    );
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VendorVerificationStatus } from '@prisma/client';
import { FlutterwaveSubaccountService } from '../payments/flutterwave-subaccount.service';
import { PrismaService } from '../prisma/prisma.service';
import { VendorPayoutService } from './vendor-payout.service';

describe('VendorPayoutService', () => {
  const prisma = {
    store: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
  };

  const subaccountService = {
    listBanks: jest.fn(),
    resolveAccount: jest.fn(),
    createOrUpdateSubaccount: jest.fn(),
  };

  let service: VendorPayoutService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorPayoutService,
        { provide: PrismaService, useValue: prisma },
        { provide: FlutterwaveSubaccountService, useValue: subaccountService },
      ],
    }).compile();

    service = module.get(VendorPayoutService);
  });

  it('rejects payout setup for unverified vendors', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.pending,
      businessName: 'Ada Store',
      whatsapp: '08012345678',
    });

    await expect(
      service.updatePayoutAccount('vendor-1', {
        bankCode: '044',
        accountNumber: '0123456789',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates subaccount for verified vendors', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
      businessName: 'Ada Store',
      whatsapp: '08012345678',
      flutterwaveSubaccountId: null,
    });
    subaccountService.listBanks.mockResolvedValue([
      { code: '044', name: 'Access Bank' },
    ]);
    subaccountService.resolveAccount.mockResolvedValue({
      accountNumber: '0123456789',
      accountName: 'Ada Lovelace',
    });
    prisma.store.update
      .mockResolvedValueOnce({
        vendorId: 'vendor-1',
        verificationStatus: VendorVerificationStatus.verified,
        businessName: 'Ada Store',
        whatsapp: '08012345678',
        payoutBankCode: '044',
        payoutBankName: 'Access Bank',
        payoutAccountNumber: '0123456789',
        payoutAccountName: 'Ada Lovelace',
        flutterwaveSubaccountId: null,
        payoutSetupComplete: false,
        payoutSetupAt: null,
      })
      .mockResolvedValueOnce({
        vendorId: 'vendor-1',
        verificationStatus: VendorVerificationStatus.verified,
        payoutBankCode: '044',
        payoutBankName: 'Access Bank',
        payoutAccountNumber: '0123456789',
        payoutAccountName: 'Ada Lovelace',
        flutterwaveSubaccountId: 'RS_VENDOR_1',
        payoutSetupComplete: true,
        payoutSetupAt: new Date('2026-06-14T12:00:00.000Z'),
      });
    subaccountService.createOrUpdateSubaccount.mockResolvedValue('RS_VENDOR_1');

    const result = await service.updatePayoutAccount('vendor-1', {
      bankCode: '044',
      accountNumber: '0123456789',
    });

    expect(result.payoutSetupComplete).toBe(true);
    expect(result.flutterwaveSubaccountId).toBe('RS_VENDOR_1');
  });

  it('throws when store is missing', async () => {
    prisma.store.findUnique.mockResolvedValue(null);

    await expect(service.getPayoutAccount('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

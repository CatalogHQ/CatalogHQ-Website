import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VendorVerificationStatus } from '@prisma/client';
import { FlutterwaveSubaccountService } from '../payments/flutterwave-subaccount.service';
import { FlutterwaveTransferService } from '../payments/flutterwave-transfer.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditService } from '../security/security-audit.service';
import { VendorPayoutService } from './vendor-payout.service';
import { BANK_ACCOUNT_NAME_MISMATCH_MESSAGE } from '../verification/nin-identity.util';

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

  const transferService = {
    createNgnBankRecipient: jest.fn(),
  };

  const securityAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const configService = {
    get: jest.fn(),
  };

  let service: VendorPayoutService;

  beforeEach(async () => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      if (key === 'FLUTTERWAVE_VENDOR_PAYOUT_MODE') {
        return 'instant';
      }
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorPayoutService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: FlutterwaveSubaccountService, useValue: subaccountService },
        { provide: FlutterwaveTransferService, useValue: transferService },
        { provide: SecurityAuditService, useValue: securityAudit },
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

  it('creates transfer recipient without subaccount in instant mode', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
      legalFirstName: 'Ada',
      legalLastName: 'Lovelace',
      businessName: 'Ada Store',
      whatsapp: '08012345678',
      flutterwaveTransferRecipientId: null,
    });
    subaccountService.listBanks.mockResolvedValue({
      banks: [{ code: '044', name: 'Access Bank' }],
      sandboxMode: false,
    });
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
        flutterwaveTransferRecipientId: null,
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
        flutterwaveTransferRecipientId: 'rcb_VENDOR_1',
        flutterwaveSubaccountId: null,
        payoutSetupComplete: true,
        payoutSetupAt: new Date('2026-06-14T12:00:00.000Z'),
      });
    transferService.createNgnBankRecipient.mockResolvedValue({
      recipientId: 'rcb_VENDOR_1',
    });

    const result = await service.updatePayoutAccount('vendor-1', {
      bankCode: '044',
      accountNumber: '0123456789',
    });

    expect(result.payoutSetupComplete).toBe(true);
    expect(result.flutterwaveTransferRecipientId).toBe('rcb_VENDOR_1');
    expect(subaccountService.createOrUpdateSubaccount).not.toHaveBeenCalled();
    expect(transferService.createNgnBankRecipient).toHaveBeenCalledWith(
      '044',
      '0123456789',
      null,
    );
  });

  it('creates subaccount when split mode is configured', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'FLUTTERWAVE_VENDOR_PAYOUT_MODE') {
        return 'split';
      }
      return undefined;
    });

    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
      legalFirstName: 'Ada',
      legalLastName: 'Lovelace',
      businessName: 'Ada Store',
      whatsapp: '08012345678',
      flutterwaveTransferRecipientId: null,
    });
    subaccountService.listBanks.mockResolvedValue({
      banks: [{ code: '044', name: 'Access Bank' }],
      sandboxMode: false,
    });
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
        flutterwaveTransferRecipientId: null,
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
        flutterwaveTransferRecipientId: 'rcb_VENDOR_1',
        flutterwaveSubaccountId: 'RS_VENDOR_1',
        payoutSetupComplete: true,
        payoutSetupAt: new Date('2026-06-14T12:00:00.000Z'),
      });
    transferService.createNgnBankRecipient.mockResolvedValue({
      recipientId: 'rcb_VENDOR_1',
    });
    subaccountService.createOrUpdateSubaccount.mockResolvedValue('RS_VENDOR_1');

    await service.updatePayoutAccount('vendor-1', {
      bankCode: '044',
      accountNumber: '0123456789',
    });

    expect(subaccountService.createOrUpdateSubaccount).toHaveBeenCalled();
  });

  it('resolves account holder name for verified vendors', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
      legalFirstName: 'Ada',
      legalLastName: 'Lovelace',
    });
    subaccountService.listBanks.mockResolvedValue({
      banks: [{ code: '044', name: 'Access Bank' }],
      sandboxMode: false,
    });
    subaccountService.resolveAccount.mockResolvedValue({
      accountNumber: '0123456789',
      accountName: 'Ada Lovelace',
    });

    const result = await service.resolvePayoutAccount('vendor-1', {
      bankCode: '044',
      accountNumber: '0123456789',
    });

    expect(result.accountName).toBe('Ada Lovelace');
    expect(subaccountService.resolveAccount).toHaveBeenCalledWith(
      '044',
      '0123456789',
    );
  });

  it('rejects payout accounts that do not match verified NIN legal name', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
      legalFirstName: 'Godwin',
      legalLastName: 'Adigun',
    });
    subaccountService.listBanks.mockResolvedValue({
      banks: [{ code: '044', name: 'Access Bank' }],
      sandboxMode: false,
    });
    subaccountService.resolveAccount.mockResolvedValue({
      accountNumber: '0123456789',
      accountName: 'Jane Smith',
    });

    await expect(
      service.updatePayoutAccount('vendor-1', {
        bankCode: '044',
        accountNumber: '0123456789',
      }),
    ).rejects.toThrow(BANK_ACCOUNT_NAME_MISMATCH_MESSAGE);
  });

  it('accepts reordered bank account names that match verified legal name', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: 'vendor-1',
      verificationStatus: VendorVerificationStatus.verified,
      legalFirstName: 'Godwin',
      legalLastName: 'Adigun',
      businessName: 'Godwin Store',
      whatsapp: '08012345678',
      flutterwaveTransferRecipientId: null,
    });
    subaccountService.listBanks.mockResolvedValue({
      banks: [{ code: '044', name: 'Access Bank' }],
      sandboxMode: false,
    });
    subaccountService.resolveAccount.mockResolvedValue({
      accountNumber: '0123456789',
      accountName: 'Adigun Godwin Toluwashe',
    });
    prisma.store.update
      .mockResolvedValueOnce({
        vendorId: 'vendor-1',
        verificationStatus: VendorVerificationStatus.verified,
        payoutBankCode: '044',
        payoutBankName: 'Access Bank',
        payoutAccountNumber: '0123456789',
        payoutAccountName: 'Adigun Godwin Toluwashe',
        flutterwaveTransferRecipientId: null,
        payoutSetupComplete: false,
        payoutSetupAt: null,
      })
      .mockResolvedValueOnce({
        vendorId: 'vendor-1',
        verificationStatus: VendorVerificationStatus.verified,
        payoutBankCode: '044',
        payoutBankName: 'Access Bank',
        payoutAccountNumber: '0123456789',
        payoutAccountName: 'Adigun Godwin Toluwashe',
        flutterwaveTransferRecipientId: 'rcb_VENDOR_1',
        flutterwaveSubaccountId: null,
        payoutSetupComplete: true,
        payoutSetupAt: new Date('2026-06-14T12:00:00.000Z'),
      });
    transferService.createNgnBankRecipient.mockResolvedValue({
      recipientId: 'rcb_VENDOR_1',
    });

    const result = await service.updatePayoutAccount('vendor-1', {
      bankCode: '044',
      accountNumber: '0123456789',
    });

    expect(result.payoutSetupComplete).toBe(true);
  });

  it('throws when store is missing', async () => {
    prisma.store.findUnique.mockResolvedValue(null);

    await expect(service.getPayoutAccount('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

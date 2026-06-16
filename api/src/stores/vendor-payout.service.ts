import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VendorVerificationStatus } from '@prisma/client';
import { FlutterwaveSubaccountService } from '../payments/flutterwave-subaccount.service';
import { FlutterwaveTransferService } from '../payments/flutterwave-transfer.service';
import { normalizeNigerianBankCode } from '../payments/flutterwave-bank.util';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { OrderDto, toOrderDto, toOrderDtoFromPayoutRecord } from '../orders/orders.mapper';

export type VendorPayoutAccountDto = {
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  flutterwaveTransferRecipientId?: string;
  payoutSetupComplete: boolean;
  payoutSetupAt?: string;
  verificationStatus?: VendorVerificationStatus;
};

@Injectable()
export class VendorPayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subaccountService: FlutterwaveSubaccountService,
    private readonly transferService: FlutterwaveTransferService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async listBanks() {
    return this.subaccountService.listBanks();
  }

  async getPayoutAccount(vendorId: string): Promise<VendorPayoutAccountDto> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    return this.toPayoutAccountDto(store);
  }

  async resolvePayoutAccount(
    vendorId: string,
    dto: UpdatePayoutDto,
  ): Promise<{ accountNumber: string; accountName: string }> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    if (store.verificationStatus !== VendorVerificationStatus.verified) {
      throw new BadRequestException(
        'Your store must be verified before checking a payout bank account.',
      );
    }

    const bank = await this.findPayoutBank(dto.bankCode);
    const accountNumber = dto.accountNumber.trim();

    return this.subaccountService.resolveAccount(bank.code, accountNumber);
  }

  async updatePayoutAccount(
    vendorId: string,
    dto: UpdatePayoutDto,
    actorUserId?: string,
  ): Promise<VendorPayoutAccountDto> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    if (store.verificationStatus !== VendorVerificationStatus.verified) {
      throw new BadRequestException(
        'Your store must be verified before linking a payout bank account.',
      );
    }

    const banksResponse = await this.subaccountService.listBanks();
    const bank = await this.findPayoutBank(dto.bankCode, banksResponse);
    const accountNumber = dto.accountNumber.trim();
    const resolved = await this.subaccountService.resolveAccount(
      bank.code,
      accountNumber,
    );

    const withBankDetails = await this.prisma.store.update({
      where: { vendorId },
      data: {
        payoutBankCode: bank.code,
        payoutBankName: bank.name,
        payoutAccountNumber: accountNumber,
        payoutAccountName: resolved.accountName,
      },
    });

    const subaccountId =
      await this.subaccountService.createOrUpdateSubaccount(withBankDetails);

    const recipient = await this.transferService.createNgnBankRecipient(
      bank.code,
      accountNumber,
      withBankDetails.flutterwaveTransferRecipientId,
    );

    const updated = await this.prisma.store.update({
      where: { vendorId },
      data: {
        flutterwaveSubaccountId: subaccountId,
        flutterwaveTransferRecipientId: recipient.recipientId,
        payoutSetupComplete: true,
        payoutSetupAt: new Date(),
      },
    });

    if (actorUserId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: actorUserId },
      });
      await this.securityAudit.log({
        actorId: actorUserId,
        actorEmail: actor?.email,
        action: SecurityAuditAction.VENDOR_PAYOUT_ACCOUNT_UPDATED,
        targetType: 'store',
        targetId: vendorId,
        metadata: {
          bankCode: bank.code,
          accountLast4: accountNumber.slice(-4),
        },
      });
    }

    return this.toPayoutAccountDto(updated);
  }

  async listPayoutHistory(vendorId: string): Promise<OrderDto[]> {
    const payouts = await this.prisma.vendorPayout.findMany({
      where: { storeId: vendorId },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });

    if (payouts.length > 0) {
      return payouts.map((payout) => toOrderDtoFromPayoutRecord(payout.order, payout));
    }

    const orders = await this.prisma.order.findMany({
      where: {
        storeId: vendorId,
        paymentStatus: 'paid',
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(toOrderDto);
  }

  private async findPayoutBank(
    bankCode: string,
    banksResponse?: Awaited<ReturnType<FlutterwaveSubaccountService['listBanks']>>,
  ) {
    const response =
      banksResponse ?? (await this.subaccountService.listBanks());
    const bank = response.banks.find(
      (entry) => entry.code === normalizeNigerianBankCode(bankCode.trim()),
    );

    if (!bank) {
      throw new BadRequestException(
        response.sandboxMode
          ? 'Flutterwave test mode only supports Access Bank (044) for payout setup.'
          : 'Select a valid bank.',
      );
    }

    return bank;
  }

  private toPayoutAccountDto(store: {
    payoutBankCode: string | null;
    payoutBankName: string | null;
    payoutAccountNumber: string | null;
    payoutAccountName: string | null;
    flutterwaveTransferRecipientId: string | null;
    payoutSetupComplete: boolean;
    payoutSetupAt: Date | null;
    verificationStatus: VendorVerificationStatus;
  }): VendorPayoutAccountDto {
    return {
      bankCode: store.payoutBankCode ?? undefined,
      bankName: store.payoutBankName ?? undefined,
      accountNumber: store.payoutAccountNumber
        ? maskAccountNumber(store.payoutAccountNumber)
        : undefined,
      accountName: store.payoutAccountName ?? undefined,
      flutterwaveTransferRecipientId:
        store.flutterwaveTransferRecipientId ?? undefined,
      payoutSetupComplete: store.payoutSetupComplete,
      payoutSetupAt: store.payoutSetupAt?.toISOString(),
      verificationStatus: store.verificationStatus,
    };
  }
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
}

export function isPayoutReady(store: {
  payoutSetupComplete: boolean;
}): boolean {
  return store.payoutSetupComplete;
}

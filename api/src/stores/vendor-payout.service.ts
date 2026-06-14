import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VendorVerificationStatus } from '@prisma/client';
import { FlutterwaveSubaccountService } from '../payments/flutterwave-subaccount.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { OrderDto, toOrderDto } from '../orders/orders.mapper';

export type VendorPayoutAccountDto = {
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  flutterwaveSubaccountId?: string;
  payoutSetupComplete: boolean;
  payoutSetupAt?: string;
  verificationStatus?: VendorVerificationStatus;
};

@Injectable()
export class VendorPayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subaccountService: FlutterwaveSubaccountService,
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

  async updatePayoutAccount(
    vendorId: string,
    dto: UpdatePayoutDto,
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

    const banks = await this.subaccountService.listBanks();
    const bank = banks.find((entry) => entry.code === dto.bankCode.trim());
    if (!bank) {
      throw new BadRequestException('Select a valid bank.');
    }

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

    const subaccountId = await this.subaccountService.createOrUpdateSubaccount(
      withBankDetails,
    );

    const updated = await this.prisma.store.update({
      where: { vendorId },
      data: {
        flutterwaveSubaccountId: subaccountId,
        payoutSetupComplete: true,
        payoutSetupAt: new Date(),
      },
    });

    return this.toPayoutAccountDto(updated);
  }

  async listPayoutHistory(vendorId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        storeId: vendorId,
        paymentStatus: 'paid',
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(toOrderDto);
  }

  private toPayoutAccountDto(store: {
    payoutBankCode: string | null;
    payoutBankName: string | null;
    payoutAccountNumber: string | null;
    payoutAccountName: string | null;
    flutterwaveSubaccountId: string | null;
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
      flutterwaveSubaccountId: store.flutterwaveSubaccountId ?? undefined,
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

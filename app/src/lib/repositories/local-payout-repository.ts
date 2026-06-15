import { readJson, writeJson } from "@/lib/local-storage";
import type { PayoutRepository } from "@/lib/repositories/payout-repository";
import { authRepository } from "@/lib/repositories/local-auth-repository";
import { orderRepository } from "@/lib/repositories/local-order-repository";
import { storeRepository } from "@/lib/repositories/local-store-repository";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { CustomerOrder } from "@/types/orders";
import type {
  PayoutBank,
  PayoutBanksResponse,
  ResolvedPayoutAccount,
  UpdatePayoutInput,
  VendorPayoutAccount,
} from "@/types/payout";

const MOCK_BANKS: PayoutBank[] = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "GTBank" },
  { code: "033", name: "UBA" },
];

type StoredPayout = {
  vendorId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  flutterwaveSubaccountId: string;
  payoutSetupComplete: boolean;
  payoutSetupAt?: string;
};

function getPayouts(): StoredPayout[] {
  return readJson<StoredPayout[]>(STORAGE_KEYS.payouts, []);
}

function savePayouts(payouts: StoredPayout[]): void {
  writeJson(STORAGE_KEYS.payouts, payouts);
}

export class LocalPayoutRepository implements PayoutRepository {
  async listBanks(): Promise<PayoutBanksResponse> {
    return {
      banks: MOCK_BANKS,
      sandboxMode: false,
    };
  }

  async getAccount(): Promise<VendorPayoutAccount> {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const store = await storeRepository.getByVendorId(session.userId);
    const payout = getPayouts().find((entry) => entry.vendorId === session.userId);

    return {
      bankCode: payout?.bankCode,
      bankName: payout?.bankName,
      accountNumber: payout?.accountNumber
        ? `******${payout.accountNumber.slice(-4)}`
        : undefined,
      accountName: payout?.accountName,
      flutterwaveSubaccountId: payout?.flutterwaveSubaccountId,
      payoutSetupComplete: payout?.payoutSetupComplete ?? false,
      payoutSetupAt: payout?.payoutSetupAt,
      verificationStatus: store?.verificationStatus,
    };
  }

  async resolveAccount(input: UpdatePayoutInput): Promise<ResolvedPayoutAccount> {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const store = await storeRepository.getByVendorId(session.userId);
    if (store?.verificationStatus !== "verified") {
      throw new Error(
        "Your store must be verified before checking a payout bank account.",
      );
    }

    const bank = MOCK_BANKS.find((entry) => entry.code === input.bankCode);
    if (!bank) {
      throw new Error("Select a valid bank.");
    }

    return {
      accountNumber: input.accountNumber,
      accountName: "Demo Vendor Account",
    };
  }

  async updateAccount(input: UpdatePayoutInput): Promise<VendorPayoutAccount> {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const store = await storeRepository.getByVendorId(session.userId);
    if (store?.verificationStatus !== "verified") {
      throw new Error(
        "Your store must be verified before linking a payout bank account.",
      );
    }

    const bank = MOCK_BANKS.find((entry) => entry.code === input.bankCode);
    if (!bank) {
      throw new Error("Select a valid bank.");
    }

    const payout: StoredPayout = {
      vendorId: session.userId,
      bankCode: bank.code,
      bankName: bank.name,
      accountNumber: input.accountNumber,
      accountName: "Demo Vendor Account",
      flutterwaveSubaccountId: `RS_MOCK_${session.userId.slice(0, 8)}`,
      payoutSetupComplete: true,
      payoutSetupAt: new Date().toISOString(),
    };

    const payouts = getPayouts().filter(
      (entry) => entry.vendorId !== session.userId,
    );
    payouts.push(payout);
    savePayouts(payouts);

    return this.getAccount();
  }

  async listHistory(): Promise<CustomerOrder[]> {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const orders = await orderRepository.listByStoreId(session.userId);
    return orders.filter((order) => order.paymentStatus === "paid");
  }
}

export const localPayoutRepository = new LocalPayoutRepository();

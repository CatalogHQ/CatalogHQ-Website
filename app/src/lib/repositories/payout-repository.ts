import type {
  PayoutBanksResponse,
  ResolvedPayoutAccount,
  UpdatePayoutInput,
  VendorPayoutAccount,
} from "@/types/payout";
import type { CustomerOrder } from "@/types/orders";

export type PayoutRepository = {
  listBanks(): Promise<PayoutBanksResponse>;
  getAccount(): Promise<VendorPayoutAccount>;
  resolveAccount(input: UpdatePayoutInput): Promise<ResolvedPayoutAccount>;
  updateAccount(input: UpdatePayoutInput): Promise<VendorPayoutAccount>;
  listHistory(): Promise<CustomerOrder[]>;
};

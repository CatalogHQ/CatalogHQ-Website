import type {
  PayoutBanksResponse,
  UpdatePayoutInput,
  VendorPayoutAccount,
} from "@/types/payout";
import type { CustomerOrder } from "@/types/orders";

export type PayoutRepository = {
  listBanks(): Promise<PayoutBanksResponse>;
  getAccount(): Promise<VendorPayoutAccount>;
  updateAccount(input: UpdatePayoutInput): Promise<VendorPayoutAccount>;
  listHistory(): Promise<CustomerOrder[]>;
};

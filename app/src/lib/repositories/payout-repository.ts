import type {
  PayoutBank,
  UpdatePayoutInput,
  VendorPayoutAccount,
} from "@/types/payout";
import type { CustomerOrder } from "@/types/orders";

export type PayoutRepository = {
  listBanks(): Promise<PayoutBank[]>;
  getAccount(): Promise<VendorPayoutAccount>;
  updateAccount(input: UpdatePayoutInput): Promise<VendorPayoutAccount>;
  listHistory(): Promise<CustomerOrder[]>;
};

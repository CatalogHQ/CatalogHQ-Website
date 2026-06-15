import { apiClient } from "@/lib/api-client";
import type { PayoutRepository } from "@/lib/repositories/payout-repository";
import type { CustomerOrder } from "@/types/orders";
import type {
  PayoutBanksResponse,
  ResolvedPayoutAccount,
  UpdatePayoutInput,
  VendorPayoutAccount,
} from "@/types/payout";

export class ApiPayoutRepository implements PayoutRepository {
  listBanks(): Promise<PayoutBanksResponse> {
    return apiClient<PayoutBanksResponse>("/stores/me/payout/banks");
  }

  getAccount(): Promise<VendorPayoutAccount> {
    return apiClient<VendorPayoutAccount>("/stores/me/payout");
  }

  resolveAccount(input: UpdatePayoutInput): Promise<ResolvedPayoutAccount> {
    return apiClient<ResolvedPayoutAccount>("/stores/me/payout/resolve", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateAccount(input: UpdatePayoutInput): Promise<VendorPayoutAccount> {
    return apiClient<VendorPayoutAccount>("/stores/me/payout", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  listHistory(): Promise<CustomerOrder[]> {
    return apiClient<CustomerOrder[]>("/stores/me/payouts");
  }
}

export const apiPayoutRepository = new ApiPayoutRepository();

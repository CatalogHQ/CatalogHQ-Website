import type { VendorVerificationStatus } from "@/types/domain";
import type { CustomerOrder } from "@/types/orders";

export type PayoutBank = {
  code: string;
  name: string;
};

export type PayoutBanksResponse = {
  banks: PayoutBank[];
  sandboxMode: boolean;
  sandboxHint?: string;
  testAccountNumbers?: string[];
};

export type VendorPayoutAccount = {
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  flutterwaveSubaccountId?: string;
  payoutSetupComplete: boolean;
  payoutSetupAt?: string;
  verificationStatus?: VendorVerificationStatus;
};

export type ResolvedPayoutAccount = {
  accountNumber: string;
  accountName: string;
};

export type UpdatePayoutInput = {
  bankCode: string;
  accountNumber: string;
};

export type PayoutOrder = Pick<
  CustomerOrder,
  | "id"
  | "paymentRef"
  | "productName"
  | "vendorNet"
  | "platformFee"
  | "totalPaid"
  | "payoutStatus"
  | "createdAt"
>;

export type PayoutStatus = CustomerOrder["payoutStatus"];

import { normalizeNigerianPhoneForFlutterwave } from './flutterwave-payment-methods';

export type V3BankTransferAuthorization = {
  transfer_account?: string;
  transfer_bank?: string;
  transfer_amount?: number;
  account_expiration?: string;
  transfer_note?: string;
};

type V3BankTransferMeta = {
  authorization?: V3BankTransferAuthorization;
};

type V3BankTransferChargePayload = {
  meta?: V3BankTransferMeta;
};

type V3BankTransferChargeResponse = {
  status: string;
  message?: string;
  data?: V3BankTransferChargePayload;
  meta?: V3BankTransferMeta;
};

export function formatFlutterwaveV3PhoneNumber(phone: string): string {
  const digits = normalizeNigerianPhoneForFlutterwave(phone);
  return `+234${digits}`;
}

export function extractV3BankTransferAuthorization(
  response: V3BankTransferChargeResponse,
): V3BankTransferAuthorization | null {
  const auth =
    response.data?.meta?.authorization ?? response.meta?.authorization;

  if (!auth?.transfer_account || !auth.transfer_bank) {
    return null;
  }

  return auth;
}

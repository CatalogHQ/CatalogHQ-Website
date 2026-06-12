import type { NinVerificationData } from './ashlab-nin-verification.service';

export const NIN_NAME_MISMATCH_MESSAGE =
  'The legal name you entered does not match the name on this NIN.';

export function normalizePersonName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s'-]/g, '')
    .replace(/\s+/g, ' ');
}

export function ninIdentityMatchesVendor(
  vendor: { legalFirstName: string; legalLastName: string },
  ninRecord: Pick<NinVerificationData, 'first_name' | 'last_name'>,
): boolean {
  const vendorFirst = normalizePersonName(vendor.legalFirstName);
  const vendorLast = normalizePersonName(vendor.legalLastName);
  const ninFirst = normalizePersonName(ninRecord.first_name);
  const ninLast = normalizePersonName(ninRecord.last_name);

  if (!vendorFirst || !vendorLast || !ninFirst || !ninLast) {
    return false;
  }

  return vendorFirst === ninFirst && vendorLast === ninLast;
}

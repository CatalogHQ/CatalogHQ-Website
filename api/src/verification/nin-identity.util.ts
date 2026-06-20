import type { NinVerificationData } from './ashlab-nin-verification.service';

export const NIN_NAME_MISMATCH_MESSAGE =
  'The legal name you entered does not match the name on this NIN.';

export const BANK_ACCOUNT_NAME_MISMATCH_MESSAGE =
  'The bank account name must match the name on your verified NIN. Use an account registered in your legal name.';

const NAME_TITLE_TOKENS = new Set([
  'mr',
  'mrs',
  'ms',
  'miss',
  'dr',
  'chief',
  'alh',
  'alhaji',
  'engr',
  'bar',
  'san',
]);

export function normalizePersonName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s'-]/g, '')
    .replace(/\s+/g, ' ');
}

export function tokenizePersonName(value: string): string[] {
  return normalizePersonName(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !NAME_TITLE_TOKENS.has(token));
}

function setsEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const token of left) {
    if (!right.has(token)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two person names flexibly: order-independent, optional middle names,
 * and subset matching when one side omits a middle name or extra part.
 */
export function personNamesMatch(nameA: string, nameB: string): boolean {
  const tokensA = tokenizePersonName(nameA);
  const tokensB = tokenizePersonName(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return false;
  }

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  if (setsEqual(setA, setB)) {
    return true;
  }

  const [shorter, longer] =
    setA.size <= setB.size ? [setA, setB] : [setB, setA];

  if (shorter.size < 2) {
    return false;
  }

  for (const token of shorter) {
    if (!longer.has(token)) {
      return false;
    }
  }

  return true;
}

export function ninRecordFullName(
  ninRecord: Pick<NinVerificationData, 'first_name' | 'last_name' | 'middle_name'>,
): string {
  return [ninRecord.first_name, ninRecord.middle_name, ninRecord.last_name]
    .filter((part) => part?.trim())
    .join(' ');
}

export function ninIdentityMatchesVendor(
  vendor: { legalFirstName: string; legalLastName: string },
  ninRecord: Pick<NinVerificationData, 'first_name' | 'last_name' | 'middle_name'>,
): boolean {
  const vendorName = `${vendor.legalFirstName} ${vendor.legalLastName}`;
  return personNamesMatch(vendorName, ninRecordFullName(ninRecord));
}

export function verifiedLegalNameMatchesBankAccount(
  store: { legalFirstName?: string | null; legalLastName?: string | null },
  bankAccountName: string,
): boolean {
  if (!store.legalFirstName?.trim() || !store.legalLastName?.trim()) {
    return false;
  }

  const legalName = `${store.legalFirstName} ${store.legalLastName}`;
  return personNamesMatch(legalName, bankAccountName);
}

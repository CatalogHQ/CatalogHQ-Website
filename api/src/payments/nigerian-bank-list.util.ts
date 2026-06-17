import { normalizeNigerianBankCode } from './flutterwave-bank.util';

export type NigerianBank = {
  code: string;
  name: string;
};

/**
 * Banks Paystack documents for Direct Debit (Nigeria).
 * @see https://paystack.com/docs/payments/direct-debit/#supported-banks
 */
export const PAYSTACK_DIRECT_DEBIT_BANKS: NigerianBank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '103', name: 'Globus Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '105', name: 'Premium Trust Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '102', name: 'Titan Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank For Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

export function mergeNigerianBanks(
  ...lists: NigerianBank[][]
): NigerianBank[] {
  const byCode = new Map<string, NigerianBank>();

  for (const list of lists) {
    for (const bank of list) {
      const code = normalizeNigerianBankCode(bank.code);
      const name = bank.name?.trim();
      if (!code || !name) {
        continue;
      }
      byCode.set(code, { code, name });
    }
  }

  return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type PaystackBankPayload = {
  name?: string;
  code?: string;
};

type PaystackListBanksResponse = {
  status?: boolean;
  data?: PaystackBankPayload[];
};

export async function fetchPaystackNigerianBanks(
  secretKey: string,
): Promise<NigerianBank[]> {
  const response = await fetch(
    'https://api.paystack.co/bank?country=nigeria&perPage=100',
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  let json: PaystackListBanksResponse;
  try {
    json = (await response.json()) as PaystackListBanksResponse;
  } catch {
    return [];
  }

  if (json.status !== true || !Array.isArray(json.data)) {
    return [];
  }

  return json.data
    .map((bank) => ({
      code: normalizeNigerianBankCode(bank.code ?? ''),
      name: bank.name?.trim() ?? '',
    }))
    .filter((bank) => bank.code && bank.name);
}

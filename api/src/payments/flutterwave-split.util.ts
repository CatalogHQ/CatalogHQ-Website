export type FlutterwaveSplitSubaccount = {
  id: string;
  transaction_charge_type: 'flat' | 'percentage';
  transaction_charge: number;
};

export function buildCheckoutSplitPayload(
  subaccountId: string,
  platformFeeNaira: number,
): FlutterwaveSplitSubaccount[] {
  if (!subaccountId || platformFeeNaira < 0) {
    return [];
  }

  return [
    {
      id: subaccountId,
      transaction_charge_type: 'flat',
      transaction_charge: platformFeeNaira,
    },
  ];
}

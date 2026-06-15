export type FlutterwaveSplitSubaccount = {
  id: string;
  transaction_charge_type: 'flat_subaccount';
  transaction_charge: number;
};

/** Route vendorNet to the vendor subaccount; platform keeps the processing fee top-up. */
export function buildCheckoutSplitPayload(
  subaccountId: string,
  vendorNetNaira: number,
): FlutterwaveSplitSubaccount[] {
  if (!subaccountId || vendorNetNaira < 0) {
    return [];
  }

  return [
    {
      id: subaccountId,
      transaction_charge_type: 'flat_subaccount',
      transaction_charge: vendorNetNaira,
    },
  ];
}

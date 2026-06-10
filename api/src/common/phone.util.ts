export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidNigerianPhone(phone: string): boolean {
  const digits = normalizePhone(phone);

  if (digits.startsWith('234')) {
    return digits.length >= 12 && digits.length <= 13;
  }

  if (digits.startsWith('0')) {
    return digits.length === 11;
  }

  return digits.length >= 10 && digits.length <= 13;
}

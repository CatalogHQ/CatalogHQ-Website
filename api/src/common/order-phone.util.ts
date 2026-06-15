import { timingSafeEqual } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { isValidNigerianPhone, normalizePhone } from './phone.util';

export function getPhoneLastFour(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '0');
}

/** @deprecated Prefer verifyCustomerPhone for order access checks. */
export function verifyPhoneLastFour(
  customerPhone: string,
  phoneLastFour: string,
): void {
  verifyCustomerPhone(customerPhone, phoneLastFour);
}

export function verifyCustomerPhone(
  customerPhone: string,
  providedPhone: string,
): void {
  const stored = normalizePhone(customerPhone);
  const provided = normalizePhone(providedPhone);

  if (!isValidNigerianPhone(stored) || !isValidNigerianPhone(provided)) {
    throw new NotFoundException('Order not found');
  }

  if (stored.length !== provided.length) {
    throw new NotFoundException('Order not found');
  }

  const match = timingSafeEqual(
    Buffer.from(stored, 'utf8'),
    Buffer.from(provided, 'utf8'),
  );

  if (!match) {
    throw new NotFoundException('Order not found');
  }
}

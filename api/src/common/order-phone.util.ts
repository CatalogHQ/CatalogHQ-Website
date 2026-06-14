import { NotFoundException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

export function getPhoneLastFour(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '0');
}

export function verifyPhoneLastFour(
  customerPhone: string,
  phoneLastFour: string,
): void {
  const stored = getPhoneLastFour(customerPhone);
  const provided = phoneLastFour.replace(/\D/g, '').slice(-4).padStart(4, '0');

  if (stored.length !== 4 || provided.length !== 4) {
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

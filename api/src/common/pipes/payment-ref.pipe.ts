import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const PAYMENT_REF_PATTERN = /^SHP-\d{8}-[A-Z0-9]{4}$/i;

@Injectable()
export class PaymentRefPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const trimmed = value?.trim();

    if (!trimmed || !PAYMENT_REF_PATTERN.test(trimmed)) {
      throw new BadRequestException('Invalid order reference.');
    }

    return trimmed.toUpperCase();
  }
}

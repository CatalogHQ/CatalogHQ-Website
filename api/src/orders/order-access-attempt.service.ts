import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class OrderAccessAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAttempt(paymentRef: string): Promise<void> {
    const record = await this.prisma.orderAccessAttempt.findUnique({
      where: { paymentRef },
    });

    if (record?.lockedUntil && record.lockedUntil > new Date()) {
      throw new HttpException(
        'Too many failed attempts. Please wait 15 minutes before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailedAttempt(paymentRef: string): Promise<void> {
    const now = new Date();
    const record = await this.prisma.orderAccessAttempt.findUnique({
      where: { paymentRef },
    });

    const attempts = (record?.attempts ?? 0) + 1;
    const lockedUntil =
      attempts >= MAX_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

    await this.prisma.orderAccessAttempt.upsert({
      where: { paymentRef },
      create: { paymentRef, attempts, lockedUntil },
      update: {
        attempts: lockedUntil ? MAX_ATTEMPTS : attempts,
        lockedUntil,
      },
    });

    if (lockedUntil) {
      throw new HttpException(
        'Too many failed attempts. Please wait 15 minutes before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async resetAttempts(paymentRef: string): Promise<void> {
    await this.prisma.orderAccessAttempt.deleteMany({ where: { paymentRef } });
  }
}

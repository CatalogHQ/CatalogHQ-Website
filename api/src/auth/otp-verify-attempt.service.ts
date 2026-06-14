import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class OtpVerifyAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAttempt(email: string): Promise<void> {
    const record = await this.prisma.otpVerifyAttempt.findUnique({
      where: { email },
    });

    if (record?.lockedUntil && record.lockedUntil > new Date()) {
      throw new HttpException(
        'Too many failed attempts. Please wait 15 minutes before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const now = new Date();
    const record = await this.prisma.otpVerifyAttempt.findUnique({
      where: { email },
    });

    const attempts = (record?.attempts ?? 0) + 1;
    const lockedUntil =
      attempts >= MAX_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

    await this.prisma.otpVerifyAttempt.upsert({
      where: { email },
      create: { email, attempts, lockedUntil },
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

  async resetAttempts(email: string): Promise<void> {
    await this.prisma.otpVerifyAttempt.deleteMany({ where: { email } });
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { normalizeEmail } from '../common/email.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  OTP_RATE_LIMITED_CODE,
  OTP_SEND_LOCKOUT_MS,
  OTP_SEND_MAX_PER_MINUTE,
  OTP_SEND_WINDOW_MS,
} from './auth.constants';

function formatWaitMinutes(until: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 60_000));
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

@Injectable()
export class OtpRateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanSendOtp(email: string): Promise<void> {
    const normalized = normalizeEmail(email);
    const now = new Date();

    const lock = await this.prisma.otpSendLock.findUnique({
      where: { email: normalized },
    });

    if (lock && lock.lockedUntil > now) {
      throw new HttpException(
        {
          message: `Too many verification code requests. Try again in ${formatWaitMinutes(lock.lockedUntil, now)}.`,
          code: OTP_RATE_LIMITED_CODE,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const windowStart = new Date(now.getTime() - OTP_SEND_WINDOW_MS);
    const recentCount = await this.prisma.emailOtp.count({
      where: {
        email: normalized,
        createdAt: { gte: windowStart },
      },
    });

    if (recentCount >= OTP_SEND_MAX_PER_MINUTE) {
      const lockedUntil = new Date(now.getTime() + OTP_SEND_LOCKOUT_MS);

      await this.prisma.otpSendLock.upsert({
        where: { email: normalized },
        create: { email: normalized, lockedUntil },
        update: { lockedUntil },
      });

      throw new HttpException(
        {
          message:
            'Too many verification code requests. You can request another code in 1 hour.',
          code: OTP_RATE_LIMITED_CODE,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

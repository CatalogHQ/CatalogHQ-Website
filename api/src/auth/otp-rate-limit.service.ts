import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { normalizeEmail } from '../common/email.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  OTP_RATE_LIMITED_CODE,
  OTP_SEND_LOCKOUT_MS,
  OTP_SEND_MAX_PER_MINUTE,
  OTP_SEND_MAX_PER_MINUTE_PER_IP,
  OTP_SEND_WINDOW_MS,
} from './auth.constants';

function formatWaitMinutes(until: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 60_000));
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

@Injectable()
export class OtpRateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanSendOtp(email: string, ipAddress: string): Promise<void> {
    const normalized = normalizeEmail(email);
    const ip = ipAddress.trim() || 'unknown';
    const now = new Date();
    const windowStart = new Date(now.getTime() - OTP_SEND_WINDOW_MS);

    const ipLock = await this.prisma.otpIpSendLock.findUnique({
      where: { ipAddress: ip },
    });

    if (ipLock && ipLock.lockedUntil > now) {
      throw new HttpException(
        {
          message: `Too many verification code requests from your network. Try again in ${formatWaitMinutes(ipLock.lockedUntil, now)}.`,
          code: OTP_RATE_LIMITED_CODE,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const emailIpLock = await this.prisma.otpSendLock.findUnique({
      where: { email_ipAddress: { email: normalized, ipAddress: ip } },
    });

    if (emailIpLock && emailIpLock.lockedUntil > now) {
      throw new HttpException(
        {
          message: `Too many verification code requests. Try again in ${formatWaitMinutes(emailIpLock.lockedUntil, now)}.`,
          code: OTP_RATE_LIMITED_CODE,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ipRecentCount = await this.prisma.otpSendLog.count({
      where: {
        ipAddress: ip,
        createdAt: { gte: windowStart },
      },
    });

    if (ipRecentCount >= OTP_SEND_MAX_PER_MINUTE_PER_IP) {
      const lockedUntil = new Date(now.getTime() + OTP_SEND_LOCKOUT_MS);

      await this.prisma.otpIpSendLock.upsert({
        where: { ipAddress: ip },
        create: { ipAddress: ip, lockedUntil },
        update: { lockedUntil },
      });

      throw new HttpException(
        {
          message:
            'Too many verification code requests from your network. You can request another code in 1 hour.',
          code: OTP_RATE_LIMITED_CODE,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const emailIpRecentCount = await this.prisma.otpSendLog.count({
      where: {
        email: normalized,
        ipAddress: ip,
        createdAt: { gte: windowStart },
      },
    });

    if (emailIpRecentCount >= OTP_SEND_MAX_PER_MINUTE) {
      const lockedUntil = new Date(now.getTime() + OTP_SEND_LOCKOUT_MS);

      await this.prisma.otpSendLock.upsert({
        where: { email_ipAddress: { email: normalized, ipAddress: ip } },
        create: { email: normalized, ipAddress: ip, lockedUntil },
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

  async recordOtpSend(email: string, ipAddress: string): Promise<void> {
    const normalized = normalizeEmail(email);
    const ip = ipAddress.trim() || 'unknown';

    await this.prisma.otpSendLog.create({
      data: {
        email: normalized,
        ipAddress: ip,
      },
    });
  }
}

import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_RATE_LIMITED_CODE } from './auth.constants';
import { OtpRateLimitService } from './otp-rate-limit.service';

describe('OtpRateLimitService', () => {
  const prisma = {
    otpSendLock: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    emailOtp: {
      count: jest.fn(),
    },
  };

  let service: OtpRateLimitService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpRateLimitService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(OtpRateLimitService);
  });

  it('allows sends when under the per-minute limit', async () => {
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.emailOtp.count.mockResolvedValue(1);

    await expect(
      service.assertCanSendOtp('vendor@example.com'),
    ).resolves.toBeUndefined();
  });

  it('blocks when an hour lock is active', async () => {
    prisma.otpSendLock.findUnique.mockResolvedValue({
      email: 'vendor@example.com',
      lockedUntil: new Date(Date.now() + 30 * 60_000),
    });

    await expect(service.assertCanSendOtp('vendor@example.com')).rejects.toMatchObject({
      response: {
        code: OTP_RATE_LIMITED_CODE,
        message: expect.stringContaining('Try again in'),
      },
    });
    expect(prisma.emailOtp.count).not.toHaveBeenCalled();
  });

  it('locks for an hour after two sends in the last minute', async () => {
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.emailOtp.count.mockResolvedValue(2);
    prisma.otpSendLock.upsert.mockResolvedValue({});

    await expect(service.assertCanSendOtp('vendor@example.com')).rejects.toBeInstanceOf(
      HttpException,
    );

    expect(prisma.otpSendLock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'vendor@example.com' },
        create: expect.objectContaining({ email: 'vendor@example.com' }),
        update: expect.objectContaining({
          lockedUntil: expect.any(Date),
        }),
      }),
    );
  });
});

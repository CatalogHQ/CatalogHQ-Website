import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_RATE_LIMITED_CODE } from './auth.constants';
import { OtpRateLimitService } from './otp-rate-limit.service';

describe('OtpRateLimitService', () => {
  const prisma = {
    otpIpSendLock: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    otpSendLock: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    otpSendLog: {
      count: jest.fn(),
      create: jest.fn(),
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

  it('allows sends when under both limits', async () => {
    prisma.otpIpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLog.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    await expect(
      service.assertCanSendOtp('vendor@example.com', '203.0.113.1'),
    ).resolves.toBeUndefined();
  });

  it('blocks when an IP hour lock is active', async () => {
    prisma.otpIpSendLock.findUnique.mockResolvedValue({
      ipAddress: '203.0.113.1',
      lockedUntil: new Date(Date.now() + 30 * 60_000),
    });

    await expect(
      service.assertCanSendOtp('vendor@example.com', '203.0.113.1'),
    ).rejects.toMatchObject({
      response: {
        code: OTP_RATE_LIMITED_CODE,
        message: expect.stringContaining('from your network'),
      },
    });
    expect(prisma.otpSendLog.count).not.toHaveBeenCalled();
  });

  it('locks email+IP for an hour after two sends in the last minute', async () => {
    prisma.otpIpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLog.count.mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    prisma.otpSendLock.upsert.mockResolvedValue({});

    await expect(
      service.assertCanSendOtp('vendor@example.com', '203.0.113.1'),
    ).rejects.toBeInstanceOf(HttpException);

    expect(prisma.otpSendLock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email_ipAddress: {
            email: 'vendor@example.com',
            ipAddress: '203.0.113.1',
          },
        },
      }),
    );
  });

  it('locks IP for an hour after too many sends across emails', async () => {
    prisma.otpIpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLog.count.mockResolvedValueOnce(10);
    prisma.otpIpSendLock.upsert.mockResolvedValue({});

    await expect(
      service.assertCanSendOtp('vendor@example.com', '203.0.113.1'),
    ).rejects.toBeInstanceOf(HttpException);

    expect(prisma.otpIpSendLock.upsert).toHaveBeenCalled();
    expect(prisma.otpSendLock.upsert).not.toHaveBeenCalled();
  });

  it('records OTP send attempts with email and IP', async () => {
    prisma.otpSendLog.create.mockResolvedValue({ id: 'log-1' });

    await service.recordOtpSend('Vendor@Example.com', '203.0.113.1');

    expect(prisma.otpSendLog.create).toHaveBeenCalledWith({
      data: {
        email: 'vendor@example.com',
        ipAddress: '203.0.113.1',
      },
    });
  });
});

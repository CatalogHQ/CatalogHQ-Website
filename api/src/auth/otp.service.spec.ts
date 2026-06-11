import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { EmailOtpPurpose } from '@prisma/client';
import { SendChampService } from '../notifications/sendchamp.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    signupPending: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    emailOtp: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const sendChamp = {
    isConfigured: jest.fn().mockReturnValue(true),
    sendEmail: jest.fn(),
  };

  const authService = {
    createSession: jest.fn(),
  };

  let service: OtpService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: SendChampService, useValue: sendChamp },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  it('stores pending signup and sends email OTP', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.signupPending.upsert.mockResolvedValue({ id: 'pending-1' });
    prisma.emailOtp.create.mockResolvedValue({ id: 'otp-1' });

    await service.initSignUp('vendor@example.com', 'password123');

    expect(prisma.signupPending.upsert).toHaveBeenCalled();
    expect(prisma.emailOtp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'vendor@example.com',
          purpose: EmailOtpPurpose.signup,
        }),
      }),
    );
    expect(sendChamp.sendEmail).toHaveBeenCalled();
  });

  it('surfaces email delivery failures during signup', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.signupPending.upsert.mockResolvedValue({ id: 'pending-1' });
    prisma.emailOtp.create.mockResolvedValue({ id: 'otp-1' });
    prisma.emailOtp.updateMany.mockResolvedValue({ count: 1 });
    sendChamp.sendEmail.mockRejectedValue(
      new ServiceUnavailableException('Could not send verification email.'),
    );

    await expect(
      service.initSignUp('vendor@example.com', 'password123'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(prisma.emailOtp.updateMany).toHaveBeenCalled();
  });

  it('rejects invalid reset code', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'vendor@example.com',
    });
    prisma.emailOtp.findFirst.mockResolvedValue({
      id: 'otp-1',
      codeHash: await bcrypt.hash('123456', 10),
    });

    await expect(
      service.resetPassword('vendor@example.com', '000000', 'newpassword1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

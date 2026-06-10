import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { SendChampService } from '../notifications/sendchamp.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    passwordOtp: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const sendChamp = {
    sendSms: jest.fn(),
  };

  let service: OtpService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: SendChampService, useValue: sendChamp },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  it('stores hashed OTP and sends SMS', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', phone: '08012345678' });
    prisma.passwordOtp.create.mockResolvedValue({ id: 'otp-1' });

    await service.sendPasswordResetOtp('08012345678');

    expect(prisma.passwordOtp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '08012345678',
          codeHash: expect.any(String),
        }),
      }),
    );
    expect(sendChamp.sendSms).toHaveBeenCalled();
  });

  it('rejects invalid reset code', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', phone: '08012345678' });
    prisma.passwordOtp.findFirst.mockResolvedValue({
      id: 'otp-1',
      codeHash: await bcrypt.hash('123456', 10),
    });

    await expect(
      service.resetPassword('08012345678', '000000', 'newpassword1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

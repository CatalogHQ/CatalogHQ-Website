import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuthService } from './admin-auth.service';

jest.mock('../lib/encryption', () => ({
  encryptTotpSecret: (value: string) => value,
  decryptTotpSecret: (value: string) => value,
}));

describe('AdminAuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: AdminAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AdminAuthService);
  });

  describe('verifyTotp', () => {
    const userId = 'admin-1';
    const secret = speakeasy.generateSecret({ length: 32 }).base32!;

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        totpSecret: secret,
      });
    });

    it('accepts a code from the current time step only', async () => {
      const token = speakeasy.totp({ secret, encoding: 'base32' });

      await expect(service.verifyTotp(userId, token)).resolves.toBe(true);
    });

    it('rejects a code from the previous time step', async () => {
      const previousStepSeconds = Math.floor(Date.now() / 1000) - 30;
      const expiredToken = speakeasy.totp({
        secret,
        encoding: 'base32',
        time: previousStepSeconds,
      });

      await expect(service.verifyTotp(userId, expiredToken)).resolves.toBe(
        false,
      );
    });

    it('rejects a code from the next time step', async () => {
      const nextStepSeconds = Math.floor(Date.now() / 1000) + 30;
      const futureToken = speakeasy.totp({
        secret,
        encoding: 'base32',
        time: nextStepSeconds,
      });

      await expect(service.verifyTotp(userId, futureToken)).resolves.toBe(
        false,
      );
    });
  });
});

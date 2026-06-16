import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditService } from '../security/security-audit.service';
import { VendorSubscriptionService } from '../subscriptions/vendor-subscription.service';
import { AuthService } from './auth.service';
import { AdminAuthService } from '../admin/admin-auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    signupPending: {
      findUnique: jest.fn(),
    },
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('token-123'),
  };

  const configService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        JWT_EXPIRES_IN: '15m',
        JWT_ADMIN_EXPIRES_IN: '30m',
        JWT_REFRESH_EXPIRES_DAYS: '7',
      };
      return values[key] ?? defaultValue;
    }),
  };

  const vendorSubscriptionService = {
    getSubscription: jest.fn().mockResolvedValue({
      status: 'active',
      planTier: 'starter',
      subscriptionExempt: false,
      hasActiveAccess: true,
      isHardBlocked: false,
      cancelAtPeriodEnd: false,
    }),
  };

  const adminAuthService = {
    requiresTotp: jest.fn().mockReturnValue(false),
    verifyTotp: jest.fn().mockResolvedValue(true),
  };

  const securityAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        {
          provide: VendorSubscriptionService,
          useValue: vendorSubscriptionService,
        },
        { provide: AdminAuthService, useValue: adminAuthService },
        { provide: SecurityAuditService, useValue: securityAudit },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('signs in with email and password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'vendor@example.com',
      phone: null,
      passwordHash: 'hashed',
      planTier: 'starter',
      subscriptionExempt: false,
      role: 'vendor',
      totpEnabled: false,
      sessionVersion: 0,
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.signIn({
      email: 'vendor@example.com',
      password: 'password123',
    });

    expect(result.token).toBe('token-123');
    expect(result.refreshToken).toHaveLength(64);
    expect(result.user.email).toBe('vendor@example.com');
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects unknown credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.signIn({ email: 'vendor@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid credentials on signin', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'vendor@example.com',
      passwordHash: 'hashed',
      planTier: 'starter',
      role: 'vendor',
      totpEnabled: false,
      sessionVersion: 0,
      createdAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.signIn({ email: 'vendor@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('token-123'),
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
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
      role: 'vendor',
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.signIn({
      email: 'vendor@example.com',
      password: 'password123',
    });

    expect(result.session.token).toBe('token-123');
    expect(result.user.email).toBe('vendor@example.com');
  });

  it('rejects invalid credentials on signin', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'vendor@example.com',
      passwordHash: 'hashed',
      planTier: 'starter',
      role: 'vendor',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.signIn({ email: 'vendor@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

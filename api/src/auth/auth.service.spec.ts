import { ConflictException, UnauthorizedException } from '@nestjs/common';
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
      create: jest.fn(),
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

  it('creates a new vendor account on signup', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      phone: '08012345678',
      planTier: 'starter',
      role: 'vendor',
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
    });

    const result = await service.signUp({
      phone: '08012345678',
      password: 'password123',
    });

    expect(result.session.token).toBe('token-123');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('rejects duplicate phone on signup', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.signUp({ phone: '08012345678', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid credentials on signin', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: '08012345678',
      passwordHash: 'hashed',
      planTier: 'starter',
      role: 'vendor',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.signIn({ phone: '08012345678', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

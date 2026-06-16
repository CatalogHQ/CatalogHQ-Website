import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditService } from './security-audit.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;

  const prisma = {
    securityAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SecurityAuditService);
    jest.clearAllMocks();
  });

  it('lists logs with category filter and pagination', async () => {
    prisma.securityAuditLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        action: 'auth.signin_failed',
        actorId: null,
        actorEmail: 'user@example.com',
        targetType: null,
        targetId: null,
        metadata: { reason: 'invalid_password' },
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-06-16T12:00:00.000Z'),
      },
    ]);
    prisma.securityAuditLog.count.mockResolvedValue(1);

    const result = await service.list({
      limit: 25,
      offset: 0,
      category: 'auth',
    });

    expect(prisma.securityAuditLog.findMany).toHaveBeenCalledWith({
      where: { action: { startsWith: 'auth.' } },
      orderBy: { createdAt: 'desc' },
      take: 25,
      skip: 0,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      action: 'auth.signin_failed',
      actorEmail: 'user@example.com',
      metadata: { reason: 'invalid_password' },
    });
  });

  it('redacts sensitive metadata keys', async () => {
    prisma.securityAuditLog.findMany.mockResolvedValue([
      {
        id: 'log-2',
        action: 'auth.refresh',
        actorId: 'user-1',
        actorEmail: 'user@example.com',
        targetType: null,
        targetId: null,
        metadata: { refreshToken: 'secret-value', scope: 'vendor' },
        ipAddress: null,
        createdAt: new Date('2026-06-16T12:00:00.000Z'),
      },
    ]);
    prisma.securityAuditLog.count.mockResolvedValue(1);

    const result = await service.list({
      limit: 50,
      offset: 0,
      category: 'all',
    });

    expect(result.items[0].metadata).toEqual({
      refreshToken: '[redacted]',
      scope: 'vendor',
    });
  });
});

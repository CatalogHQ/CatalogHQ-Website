import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthDetailService } from './health-detail.service';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

describe('HealthDetailService', () => {
  let service: HealthDetailService;

  const prismaHealth = {
    isHealthy: jest.fn(),
  };

  const redisHealth = {
    isHealthy: jest.fn(),
    getStorageMode: jest.fn(),
    isConfigured: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') {
        return 'test';
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthDetailService,
        { provide: PrismaHealthIndicator, useValue: prismaHealth },
        { provide: RedisHealthIndicator, useValue: redisHealth },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(HealthDetailService);
    jest.clearAllMocks();
  });

  it('returns ok when database and redis are healthy', async () => {
    prismaHealth.isHealthy.mockResolvedValue({ database: { status: 'up' } });
    redisHealth.isHealthy.mockResolvedValue({
      redis: { status: 'up', configured: true, storage: 'redis' },
    });
    redisHealth.getStorageMode.mockReturnValue('redis');
    redisHealth.isConfigured.mockReturnValue(true);

    const result = await service.getDetail();

    expect(result.status).toBe('ok');
    expect(result.checks.database.status).toBe('up');
    expect(result.checks.redis.status).toBe('up');
    expect(result.checks.rateLimitStorage).toBe('redis');
  });

  it('returns degraded when redis is unavailable', async () => {
    prismaHealth.isHealthy.mockResolvedValue({ database: { status: 'up' } });
    redisHealth.isHealthy.mockRejectedValue(new Error('Connection refused'));
    redisHealth.getStorageMode.mockReturnValue('redis');
    redisHealth.isConfigured.mockReturnValue(true);

    const result = await service.getDetail();

    expect(result.status).toBe('degraded');
    expect(result.checks.redis.status).toBe('down');
    expect(result.checks.redis.message).toContain('Connection refused');
  });
});

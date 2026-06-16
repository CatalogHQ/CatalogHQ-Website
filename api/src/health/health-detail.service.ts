import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

export type HealthDetailCheck = {
  status: 'up' | 'down';
  configured?: boolean;
  storage?: 'redis' | 'memory';
  message?: string;
};

export type HealthDetailResponse = {
  status: 'ok' | 'degraded';
  timestamp: string;
  environment: string;
  checks: {
    database: HealthDetailCheck;
    redis: HealthDetailCheck;
    rateLimitStorage: 'redis' | 'memory';
  };
};

@Injectable()
export class HealthDetailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  async getDetail(): Promise<HealthDetailResponse> {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    const rateLimitStorage = this.redisHealth.getStorageMode();

    const status =
      database.status === 'up' && redis.status === 'up' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV') ?? 'development',
      checks: {
        database,
        redis,
        rateLimitStorage,
      },
    };
  }

  private async checkDatabase(): Promise<HealthDetailCheck> {
    try {
      await this.prismaHealth.isHealthy('database');
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database unavailable',
      };
    }
  }

  private async checkRedis(): Promise<HealthDetailCheck> {
    const configured = this.redisHealth.isConfigured();

    try {
      await this.redisHealth.isHealthy('redis');
      return {
        status: 'up',
        configured,
        storage: configured ? 'redis' : 'memory',
      };
    } catch (error) {
      return {
        status: 'down',
        configured,
        storage: configured ? 'redis' : 'memory',
        message: error instanceof Error ? error.message : 'Redis unavailable',
      };
    }
  }
}

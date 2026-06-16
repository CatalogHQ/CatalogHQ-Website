import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('REDIS_URL')?.trim());
  }

  getStorageMode(): 'redis' | 'memory' {
    return this.isConfigured() ? 'redis' : 'memory';
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisUrl = this.configService.get<string>('REDIS_URL')?.trim();
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (!redisUrl) {
      const healthy = !isProduction;
      const result = this.getStatus(key, healthy, {
        configured: false,
        storage: 'memory',
      });

      if (!healthy) {
        throw new HealthCheckError(
          'Redis is not configured in production',
          result,
        );
      }

      return result;
    }

    let redis: Redis | undefined;

    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 3_000,
        lazyConnect: true,
      });

      await redis.connect();
      const pong = await redis.ping();

      if (pong !== 'PONG') {
        throw new Error(`Unexpected Redis ping response: ${pong}`);
      }

      return this.getStatus(key, true, {
        configured: true,
        storage: 'redis',
      });
    } catch (error) {
      const result = this.getStatus(key, false, {
        configured: true,
        storage: 'redis',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new HealthCheckError('Redis check failed', result);
    } finally {
      if (redis) {
        await redis.quit().catch(() => undefined);
      }
    }
  }
}

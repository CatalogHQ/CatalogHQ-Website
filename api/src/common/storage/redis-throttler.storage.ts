import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.redis.on('error', (error) => {
      this.logger.warn(`Redis throttler error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const namespacedKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${namespacedKey}:blocked`;

    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const timeToBlockExpire = await this.redis.pttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.max(timeToBlockExpire, 0),
      };
    }

    const totalHits = await this.redis.incr(namespacedKey);
    if (totalHits === 1) {
      await this.redis.pexpire(namespacedKey, ttl);
    }

    const timeToExpire = await this.redis.pttl(namespacedKey);

    if (totalHits > limit) {
      await this.redis.psetex(blockKey, blockDuration, '1');
      return {
        totalHits,
        timeToExpire: Math.max(timeToExpire, 0),
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return {
      totalHits,
      timeToExpire: Math.max(timeToExpire, 0),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}

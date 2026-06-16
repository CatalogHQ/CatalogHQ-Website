import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AdminModule } from '../admin/admin.module';
import { CommonModule } from '../common/common.module';
import { HealthController } from './health.controller';
import { HealthDetailService } from './health-detail.service';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [TerminusModule, CommonModule, AdminModule],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    HealthDetailService,
  ],
})
export class HealthModule {}

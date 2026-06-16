import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CommonModule } from './common/common.module';
import { AdminSetupGuard } from './common/guards/admin-setup.guard';
import { ActiveSubscriptionGuard } from './common/guards/active-subscription.guard';
import { PlanFeatureGuard } from './common/guards/plan-feature.guard';
import { RedisThrottlerStorage } from './common/storage/redis-throttler.storage';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StoresModule } from './stores/stores.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TicketsModule } from './tickets/tickets.module';
import { SecurityModule } from './security/security.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL')?.trim();
        const storage = redisUrl
          ? new RedisThrottlerStorage(redisUrl)
          : undefined;

        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60_000,
              limit: 100,
            },
            {
              name: 'auth',
              ttl: 60_000,
              limit: 5,
            },
            {
              name: 'checkout',
              ttl: 60_000,
              limit: 20,
            },
            {
              name: 'order-access-ip',
              ttl: 60_000,
              limit: 40,
            },
          ],
          ...(storage ? { storage } : {}),
        };
      },
    }),
    PrismaModule,
    SecurityModule,
    CommonModule,
    NotificationsModule,
    PaymentsModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
    ReviewsModule,
    UploadsModule,
    TicketsModule,
    PlansModule,
    SubscriptionsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminSetupGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActiveSubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PlanFeatureGuard,
    },
  ],
})
export class AppModule {}

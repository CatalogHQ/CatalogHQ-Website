import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlansModule } from '../plans/plans.module';
import { FlutterwaveSubscriptionService } from './flutterwave-subscription.service';
import { SubscriptionSchedulerService } from './subscription.scheduler';
import { SubscriptionsController } from './subscriptions.controller';
import { VendorSubscriptionService } from './vendor-subscription.service';

@Module({
  imports: [PlansModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [
    FlutterwaveSubscriptionService,
    VendorSubscriptionService,
    SubscriptionSchedulerService,
  ],
  exports: [VendorSubscriptionService, FlutterwaveSubscriptionService],
})
export class SubscriptionsModule {}

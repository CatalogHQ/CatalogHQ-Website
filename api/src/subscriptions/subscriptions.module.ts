import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { PaystackSubscriptionWebhookController } from './paystack-subscription.controller';
import { PaystackSubscriptionService } from './paystack-subscription.service';
import { SubscriptionSchedulerService } from './subscription.scheduler';
import { SubscriptionsController } from './subscriptions.controller';
import { VendorSubscriptionService } from './vendor-subscription.service';

@Module({
  imports: [
    PlansModule,
    NotificationsModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [SubscriptionsController, PaystackSubscriptionWebhookController],
  providers: [
    PaystackSubscriptionService,
    VendorSubscriptionService,
    SubscriptionSchedulerService,
  ],
  exports: [VendorSubscriptionService, PaystackSubscriptionService],
})
export class SubscriptionsModule {}

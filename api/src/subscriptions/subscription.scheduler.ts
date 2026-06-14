import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VendorSubscriptionService } from './vendor-subscription.service';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly vendorSubscriptionService: VendorSubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailySubscriptionTasks(): Promise<void> {
    const expired =
      await this.vendorSubscriptionService.expireGracePeriodSubscriptions();
    const reminders = await this.vendorSubscriptionService.sendGraceReminders();

    if (expired > 0 || reminders > 0) {
      this.logger.log(
        `Subscription cron: expired=${expired}, graceReminders=${reminders}`,
      );
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

const MAX_EXPIRE_BATCH = 100;

@Injectable()
export class ReservedOrderExpiryService {
  private readonly logger = new Logger(ReservedOrderExpiryService.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpiredReservedStock(): Promise<void> {
    const expired = await this.ordersService.expireStaleReservedOrders(
      MAX_EXPIRE_BATCH,
    );

    if (expired > 0) {
      this.logger.log(
        `Released stock for ${expired} expired reserved order(s).`,
      );
    }
  }
}

import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { StoresModule } from '../stores/stores.module';
import { AbandonedCartService } from './abandoned-cart.service';
import { OrderAccessAttemptService } from './order-access-attempt.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PaymentsModule, PlansModule, StoresModule],
  controllers: [OrdersController],
  providers: [OrdersService, AbandonedCartService, OrderAccessAttemptService],
  exports: [OrdersService, OrderAccessAttemptService],
})
export class OrdersModule {}

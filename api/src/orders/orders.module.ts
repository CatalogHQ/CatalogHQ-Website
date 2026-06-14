import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { AbandonedCartService } from './abandoned-cart.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PaymentsModule, PlansModule],
  controllers: [OrdersController],
  providers: [OrdersService, AbandonedCartService],
  exports: [OrdersService],
})
export class OrdersModule {}

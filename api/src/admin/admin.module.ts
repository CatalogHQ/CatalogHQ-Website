import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { TicketsModule } from '../tickets/tickets.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, CommonModule, TicketsModule, PaymentsModule, PlansModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

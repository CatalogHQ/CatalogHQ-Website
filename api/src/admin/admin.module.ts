import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { TicketsModule } from '../tickets/tickets.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminTotpGuard } from './admin-totp.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, CommonModule, TicketsModule, PaymentsModule, PlansModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthService, AdminTotpGuard],
  exports: [AdminAuthService, AdminTotpGuard],
})
export class AdminModule {}

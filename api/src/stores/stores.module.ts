import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { VerificationModule } from '../verification/verification.module';
import { StoreStaffService } from './store-staff.service';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { VendorPayoutService } from './vendor-payout.service';
import { VendorToolsService } from './vendor-tools.service';

@Module({
  imports: [AuthModule, PaymentsModule, PlansModule, VerificationModule, EventEmitterModule],
  controllers: [StoresController],
  providers: [StoresService, VendorToolsService, StoreStaffService, VendorPayoutService, VendorStoreAccessService],
  exports: [StoresService],
})
export class StoresModule {}

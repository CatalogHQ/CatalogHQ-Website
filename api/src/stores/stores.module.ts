import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { StoreStaffService } from './store-staff.service';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { VendorToolsService } from './vendor-tools.service';

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [StoresController],
  providers: [StoresService, VendorToolsService, StoreStaffService],
  exports: [StoresService],
})
export class StoresModule {}

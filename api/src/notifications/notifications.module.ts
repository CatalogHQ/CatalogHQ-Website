import { Global, Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { NotificationsListener } from './notifications.listener';
import { LowStockAlertService } from './low-stock-alert.service';
import { PingramEmailService } from './pingram-email.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  imports: [PlansModule],
  providers: [
    PingramEmailService,
    SmsService,
    NotificationsListener,
    LowStockAlertService,
  ],
  exports: [PingramEmailService, SmsService, LowStockAlertService],
})
export class NotificationsModule {}

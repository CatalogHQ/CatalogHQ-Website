import { Global, Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { NotificationsListener } from './notifications.listener';
import { PingramEmailService } from './pingram-email.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  imports: [PlansModule],
  providers: [PingramEmailService, SmsService, NotificationsListener],
  exports: [PingramEmailService, SmsService],
})
export class NotificationsModule {}

import { Global, Module } from '@nestjs/common';
import { NotificationsListener } from './notifications.listener';
import { PingramEmailService } from './pingram-email.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  providers: [PingramEmailService, SmsService, NotificationsListener],
  exports: [PingramEmailService, SmsService],
})
export class NotificationsModule {}

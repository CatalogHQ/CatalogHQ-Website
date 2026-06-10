import { Global, Module } from '@nestjs/common';
import { NotificationsListener } from './notifications.listener';
import { SendChampService } from './sendchamp.service';

@Global()
@Module({
  providers: [SendChampService, NotificationsListener],
  exports: [SendChampService],
})
export class NotificationsModule {}

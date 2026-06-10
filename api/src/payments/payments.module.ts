import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaystackService, PaymentsService],
  exports: [PaystackService, PaymentsService],
})
export class PaymentsModule {}

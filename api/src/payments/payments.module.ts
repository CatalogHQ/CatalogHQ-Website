import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlutterwaveService } from './flutterwave.service';

@Module({
  controllers: [PaymentsController],
  providers: [FlutterwaveService, PaymentsService],
  exports: [FlutterwaveService, PaymentsService],
})
export class PaymentsModule {}

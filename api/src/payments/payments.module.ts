import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import { FlutterwaveService } from './flutterwave.service';

@Module({
  controllers: [PaymentsController],
  providers: [FlutterwaveAuthService, FlutterwaveService, PaymentsService],
  exports: [FlutterwaveAuthService, FlutterwaveService, PaymentsService],
})
export class PaymentsModule {}

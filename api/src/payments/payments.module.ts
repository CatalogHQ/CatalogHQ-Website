import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveSubaccountService } from './flutterwave-subaccount.service';

@Module({
  imports: [forwardRef(() => SubscriptionsModule)],
  controllers: [PaymentsController],
  providers: [
    FlutterwaveAuthService,
    FlutterwaveService,
    FlutterwaveSubaccountService,
    PaymentsService,
  ],
  exports: [
    FlutterwaveAuthService,
    FlutterwaveService,
    FlutterwaveSubaccountService,
    PaymentsService,
  ],
})
export class PaymentsModule {}

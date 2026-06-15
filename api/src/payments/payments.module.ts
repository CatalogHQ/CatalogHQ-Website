import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveSubaccountService } from './flutterwave-subaccount.service';
import { FlutterwaveTransferService } from './flutterwave-transfer.service';
import { VendorPayoutRetryService } from './vendor-payout-retry.service';

@Module({
  imports: [forwardRef(() => SubscriptionsModule)],
  controllers: [PaymentsController],
  providers: [
    FlutterwaveAuthService,
    FlutterwaveService,
    FlutterwaveSubaccountService,
    FlutterwaveTransferService,
    PaymentsService,
    VendorPayoutRetryService,
  ],
  exports: [
    FlutterwaveAuthService,
    FlutterwaveService,
    FlutterwaveSubaccountService,
    FlutterwaveTransferService,
    PaymentsService,
  ],
})
export class PaymentsModule {}

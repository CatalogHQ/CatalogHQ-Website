import { IsIn, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { FLUTTERWAVE_PAYMENT_METHODS } from '../../payments/flutterwave-payment-methods';
import { OrderCheckoutBaseDto } from './order-checkout-base.dto';

export class CheckoutPaymentDto extends OrderCheckoutBaseDto {
  @IsIn(FLUTTERWAVE_PAYMENT_METHODS)
  paymentMethod!: (typeof FLUTTERWAVE_PAYMENT_METHODS)[number];

  @ValidateIf((dto: CheckoutPaymentDto) => dto.paymentMethod === 'ussd')
  @IsString()
  @MinLength(3)
  ussdBankCode?: string;
}

import { IsString, MinLength } from 'class-validator';
import { CheckoutPaymentDto } from './checkout-payment.dto';

export class CheckoutOrderDto extends CheckoutPaymentDto {
  @IsString()
  @MinLength(1)
  storeSlug!: string;
}

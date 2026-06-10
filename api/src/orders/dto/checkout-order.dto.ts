import { IsString, MinLength } from 'class-validator';
import { OrderCheckoutBaseDto } from './order-checkout-base.dto';

export class CheckoutOrderDto extends OrderCheckoutBaseDto {
  @IsString()
  @MinLength(1)
  storeSlug!: string;
}

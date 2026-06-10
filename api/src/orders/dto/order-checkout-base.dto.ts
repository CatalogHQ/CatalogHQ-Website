import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { DELIVERY_TYPE_IDS } from '../../common/constants/delivery-types';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class OrderCheckoutBaseDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  productId!: string;

  @IsString()
  @MinLength(1)
  productName!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsIn(DELIVERY_TYPE_IDS)
  deliveryType!: (typeof DELIVERY_TYPE_IDS)[number];

  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;
}

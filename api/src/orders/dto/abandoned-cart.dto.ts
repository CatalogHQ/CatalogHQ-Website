import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class AbandonedCartDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsObject()
  cartData!: Record<string, unknown>;
}

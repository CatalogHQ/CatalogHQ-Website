import { IsString, MinLength, Validate } from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class ForgotPasswordDto {
  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  phone!: string;
}

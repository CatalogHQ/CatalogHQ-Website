import { IsString, MinLength, Validate } from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class SignInDto {
  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  phone!: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

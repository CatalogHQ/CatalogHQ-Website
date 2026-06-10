import { IsString, MinLength, Validate } from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class ResetPasswordDto {
  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  phone!: string;

  @IsString()
  @MinLength(6)
  code!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword!: string;
}

import { IsEmail, IsOptional, IsString, MinLength, Validate } from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class SignUpDto {
  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;
}

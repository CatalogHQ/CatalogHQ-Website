import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}

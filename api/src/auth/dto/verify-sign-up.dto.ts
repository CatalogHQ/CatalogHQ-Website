import { IsEmail, IsString, Length } from 'class-validator';

export class VerifySignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'Enter the 6-digit code' })
  code!: string;
}

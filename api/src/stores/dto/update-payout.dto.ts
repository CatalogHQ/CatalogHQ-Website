import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePayoutDto {
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  bankCode!: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'Account number must be 10 digits.' })
  accountNumber!: string;
}

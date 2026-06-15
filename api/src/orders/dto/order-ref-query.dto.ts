import { Matches, IsString, MinLength, MaxLength } from 'class-validator';

export class OrderRefQueryDto {
  @IsString()
  @MinLength(10)
  @MaxLength(14)
  @Matches(/^[0-9+]+$/, {
    message: 'Enter the phone number used when placing the order.',
  })
  phone!: string;
}

import { IsString, Matches, MinLength } from 'class-validator';

export class MarkTransferReferenceDto {
  @IsString()
  @MinLength(3)
  transferReference!: string;

  @IsString()
  @MinLength(10)
  @Matches(/^[0-9+]+$/, {
    message: 'Enter the phone number used when placing the order.',
  })
  customerPhone!: string;
}

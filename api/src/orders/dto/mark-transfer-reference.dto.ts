import { IsString, Length, Matches, MinLength } from 'class-validator';

export class MarkTransferReferenceDto {
  @IsString()
  @MinLength(3)
  transferReference!: string;

  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  phoneLastFour!: string;
}

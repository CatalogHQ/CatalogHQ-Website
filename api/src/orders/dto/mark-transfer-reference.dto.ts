import { IsString, MinLength } from 'class-validator';

export class MarkTransferReferenceDto {
  @IsString()
  @MinLength(3)
  transferReference!: string;
}

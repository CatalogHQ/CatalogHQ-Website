import { IsString, MinLength } from 'class-validator';

export class QuickReplyDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}

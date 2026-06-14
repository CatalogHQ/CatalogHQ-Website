import { IsString, MinLength } from 'class-validator';

export class ConfirmSubscriptionDto {
  @IsString()
  @MinLength(8)
  reference!: string;
}

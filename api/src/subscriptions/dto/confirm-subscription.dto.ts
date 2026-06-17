import { IsString, Matches, MinLength } from 'class-validator';

export class ConfirmSubscriptionDto {
  @IsString()
  @MinLength(8)
  @Matches(/^sub_[a-zA-Z0-9]+$/, {
    message: 'Invalid subscription reference.',
  })
  reference!: string;
}

import { IsEnum } from 'class-validator';
import { PlanTier } from '@prisma/client';

export class SubscriptionCheckoutDto {
  @IsEnum(PlanTier)
  planTier!: PlanTier;
}

export class ConfirmSubscriptionQueryDto {
  reference?: string;
}

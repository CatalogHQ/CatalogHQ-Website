import { PlanTier } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateVendorDto {
  @IsEnum(PlanTier)
  planTier!: PlanTier;
}

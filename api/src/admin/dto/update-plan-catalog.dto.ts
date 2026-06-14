import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PlanTier } from '@prisma/client';

export class UpdatePlanCatalogDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyPriceKobo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  priceSubtext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  cta?: string;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  productLimit?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureBullets?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PlanTierParamDto {
  @IsEnum(PlanTier)
  tier!: PlanTier;
}

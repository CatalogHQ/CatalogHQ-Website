import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDiscountCodeDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsIn(['percent', 'fixed'])
  type!: 'percent' | 'fixed';

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  flashEndsAt?: string;
}

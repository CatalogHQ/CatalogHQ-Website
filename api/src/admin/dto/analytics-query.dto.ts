import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class RevenueAnalyticsQueryDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d', 'month'])
  preset: '7d' | '30d' | '90d' | 'month' = '7d';
}

export class TopVendorsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 5;
}

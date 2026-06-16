import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const SECURITY_AUDIT_CATEGORIES = [
  'all',
  'auth',
  'admin',
  'payment',
  'subscription',
  'vendor',
] as const;

export type SecurityAuditCategory =
  (typeof SECURITY_AUDIT_CATEGORIES)[number];

export class ListSecurityAuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(SECURITY_AUDIT_CATEGORIES)
  category: SecurityAuditCategory = 'all';
}

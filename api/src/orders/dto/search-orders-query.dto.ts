import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchOrdersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

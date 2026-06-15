import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FlutterwaveWebhookDataDto {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  tx_ref?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class FlutterwaveWebhookDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlutterwaveWebhookDataDto)
  data?: FlutterwaveWebhookDataDto;
}

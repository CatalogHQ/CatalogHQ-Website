import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FlutterwaveWebhookDataDto {
  @IsOptional()
  @IsString()
  tx_ref?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class FlutterwaveWebhookDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlutterwaveWebhookDataDto)
  data?: FlutterwaveWebhookDataDto;
}

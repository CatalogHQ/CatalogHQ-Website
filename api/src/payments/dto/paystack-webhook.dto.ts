import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PaystackWebhookDataDto {
  @IsOptional()
  @IsString()
  reference?: string;
}

export class PaystackWebhookDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaystackWebhookDataDto)
  data?: PaystackWebhookDataDto;
}

import { IsOptional, IsString } from 'class-validator';

/**
 * SendChamp delivery callbacks (SMS and email). Field names follow SendChamp docs;
 * extra keys may be present and are ignored by validation whitelist.
 */
export class SendChampWebhookDto {
  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  sms_uid?: string;

  @IsOptional()
  @IsString()
  email_uid?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

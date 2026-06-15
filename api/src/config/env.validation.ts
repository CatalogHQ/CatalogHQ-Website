import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_KEY?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_SECRET?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_FOLDER?: string;

  @IsOptional()
  @IsString()
  PINGRAM_API_KEY?: string;

  @IsOptional()
  @IsString()
  PINGRAM_BASE_URL?: string;

  @IsOptional()
  @IsString()
  PINGRAM_FROM_EMAIL?: string;

  @IsOptional()
  @IsString()
  PINGRAM_FROM_NAME?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_ENV?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_CALLBACK_BASE_URL?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_SCENARIO_KEY?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  SUBSCRIPTION_GRACE_DAYS?: string;

  @IsOptional()
  @IsString()
  SUBSCRIPTION_COMP_DAYS?: string;

  @IsOptional()
  @IsString()
  ASHLAB_VERIFY_API_KEY?: string;

  @IsOptional()
  @IsString()
  ASHLAB_VERIFY_API_SECRET?: string;

  @IsOptional()
  @IsString()
  ASHLAB_VERIFY_BEARER_TOKEN?: string;

  @IsOptional()
  @IsString()
  ASHLAB_VERIFY_BASE_URL?: string;

  @IsOptional()
  @IsString()
  ASHLAB_VERIFY_PATH?: string;

  @IsOptional()
  @IsString()
  ASHLAB_VERIFY_DEBUG?: string;

  @IsOptional()
  @IsString()
  NIN_ENCRYPTION_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (config.NODE_ENV === 'production') {
    const ninKey = config.NIN_ENCRYPTION_KEY;
    if (typeof ninKey !== 'string' || ninKey.length !== 64) {
      throw new Error(
        'NIN_ENCRYPTION_KEY must be a 64-character hex string in production',
      );
    }

    if (config.FLUTTERWAVE_ENV !== 'production') {
      throw new Error(
        'FLUTTERWAVE_ENV must be production when NODE_ENV is production',
      );
    }

    const requiredFlutterwaveKeys = [
      'FLUTTERWAVE_CLIENT_ID',
      'FLUTTERWAVE_CLIENT_SECRET',
      'FLUTTERWAVE_SECRET_KEY',
      'FLUTTERWAVE_WEBHOOK_SECRET',
      'FLUTTERWAVE_CALLBACK_BASE_URL',
    ] as const;

    for (const key of requiredFlutterwaveKeys) {
      const value = config[key];
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`${key} is required in production`);
      }
    }
  }

  return validated;
}

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
  PAYSTACK_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  PAYSTACK_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  PAYSTACK_CALLBACK_BASE_URL?: string;

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

  return validated;
}

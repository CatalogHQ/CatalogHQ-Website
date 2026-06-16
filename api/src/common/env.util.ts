import { ConfigService } from '@nestjs/config';

export function isProductionEnv(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

export function isDevPaymentMocksEnabled(configService: ConfigService): boolean {
  if (isProductionEnv(configService)) {
    return false;
  }

  return configService.get<string>('ALLOW_DEV_PAYMENT_MOCKS') === 'true';
}

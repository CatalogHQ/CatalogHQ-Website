import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('validateEnv production guards', () => {
  const baseProductionConfig = {
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'a'.repeat(32),
    NODE_ENV: 'production',
    NIN_ENCRYPTION_KEY: 'a'.repeat(64),
    FLUTTERWAVE_ENV: 'production',
    FLUTTERWAVE_CLIENT_ID: 'client',
    FLUTTERWAVE_CLIENT_SECRET: 'secret',
    FLUTTERWAVE_SECRET_KEY: 'sk',
    FLUTTERWAVE_WEBHOOK_SECRET: 'whsec',
    FLUTTERWAVE_CALLBACK_BASE_URL: 'https://cataloghq.store',
    PAYSTACK_SECRET_KEY: 'sk_test_paystack',
    PAYSTACK_CALLBACK_BASE_URL: 'https://cataloghq.store',
    REDIS_URL: 'redis://localhost:6379',
  };

  it('accepts a valid production config', () => {
    expect(() => validateEnv(baseProductionConfig)).not.toThrow();
  });

  it('rejects PAYMENT_ALLOW_WEBHOOK_ONLY_CONFIRM in production', () => {
    expect(() =>
      validateEnv({
        ...baseProductionConfig,
        PAYMENT_ALLOW_WEBHOOK_ONLY_CONFIRM: 'true',
      }),
    ).toThrow('PAYMENT_ALLOW_WEBHOOK_ONLY_CONFIRM cannot be enabled in production');
  });

  it('rejects ASHLAB_VERIFY_DEBUG in production', () => {
    expect(() =>
      validateEnv({
        ...baseProductionConfig,
        ASHLAB_VERIFY_DEBUG: 'true',
      }),
    ).toThrow('ASHLAB_VERIFY_DEBUG cannot be enabled in production');
  });

  it('rejects ALLOW_DEV_PAYMENT_MOCKS in production', () => {
    expect(() =>
      validateEnv({
        ...baseProductionConfig,
        ALLOW_DEV_PAYMENT_MOCKS: 'true',
      }),
    ).toThrow('ALLOW_DEV_PAYMENT_MOCKS cannot be enabled in production');
  });
});

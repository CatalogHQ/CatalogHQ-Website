import { ConfigService } from '@nestjs/config';
import {
  isDevPaymentMocksEnabled,
  isProductionEnv,
} from './env.util';

describe('env.util', () => {
  const createConfig = (values: Record<string, string | undefined>) =>
    ({
      get: (key: string) => values[key],
    }) as ConfigService;

  it('detects production environment', () => {
    expect(
      isProductionEnv(createConfig({ NODE_ENV: 'production' })),
    ).toBe(true);
    expect(
      isProductionEnv(createConfig({ NODE_ENV: 'development' })),
    ).toBe(false);
  });

  it('disables dev payment mocks in production', () => {
    expect(
      isDevPaymentMocksEnabled(
        createConfig({
          NODE_ENV: 'production',
          ALLOW_DEV_PAYMENT_MOCKS: 'true',
        }),
      ),
    ).toBe(false);
  });

  it('requires explicit flag for dev payment mocks', () => {
    expect(
      isDevPaymentMocksEnabled(
        createConfig({
          NODE_ENV: 'development',
          ALLOW_DEV_PAYMENT_MOCKS: 'false',
        }),
      ),
    ).toBe(false);
    expect(
      isDevPaymentMocksEnabled(
        createConfig({
          NODE_ENV: 'development',
          ALLOW_DEV_PAYMENT_MOCKS: 'true',
        }),
      ),
    ).toBe(true);
  });
});

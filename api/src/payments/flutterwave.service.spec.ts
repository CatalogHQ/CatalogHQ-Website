import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import { FlutterwaveService } from './flutterwave.service';

describe('FlutterwaveService', () => {
  const auth = {
    isConfigured: jest.fn().mockReturnValue(true),
    getAccessToken: jest.fn().mockResolvedValue('access-token'),
  };

  const configService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        FLUTTERWAVE_ENV: 'sandbox',
        FLUTTERWAVE_WEBHOOK_SECRET: 'webhook-secret',
        FLUTTERWAVE_CALLBACK_BASE_URL: 'http://localhost:3000',
      };
      return values[key] ?? defaultValue;
    }),
  };

  let service: FlutterwaveService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlutterwaveService,
        { provide: ConfigService, useValue: configService },
        { provide: FlutterwaveAuthService, useValue: auth },
      ],
    }).compile();

    service = module.get(FlutterwaveService);
  });

  it('parses redirect_url next_action', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        status: 'success',
        message: 'Charge created',
        data: {
          reference: 'flw-ref-1',
          next_action: {
            type: 'redirect_url',
            redirect_url: { url: 'https://checkout.example/redirect' },
          },
        },
      }),
    });

    const result = await service.initializeTransaction({
      email: 'buyer@example.com',
      phone: '08012345678',
      name: 'Ada Lovelace',
      amountNaira: 5000,
      reference: 'flw-ref-1',
      callbackPath: '/callback',
      paymentMethod: 'opay',
    });

    expect(result.authorizationUrl).toBe('https://checkout.example/redirect');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(init.headers['X-Idempotency-Key']).toBeDefined();
    expect(init.headers['X-Idempotency-Key']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('reuses the same idempotency key when retrying after a 5xx', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: { get: () => null },
        json: async () => ({
          status: 'failed',
          error: { message: 'Bad gateway' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'true' },
        json: async () => ({
          status: 'success',
          data: {
            reference: 'flw-ref-1',
            next_action: {
              type: 'redirect_url',
              redirect_url: { url: 'https://checkout.example/redirect' },
            },
          },
        }),
      });

    await service.initializeTransaction({
      email: 'buyer@example.com',
      phone: '08012345678',
      name: 'Ada Lovelace',
      amountNaira: 5000,
      reference: 'flw-ref-1',
      callbackPath: '/callback',
      paymentMethod: 'opay',
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstKey = (global.fetch as jest.Mock).mock.calls[0][1].headers[
      'X-Idempotency-Key'
    ];
    const secondKey = (global.fetch as jest.Mock).mock.calls[1][1].headers[
      'X-Idempotency-Key'
    ];
    expect(firstKey).toBe(secondKey);
  });

  it('verifies succeeded charge with matching amount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        status: 'success',
        message: 'Charges fetched',
        data: [
          {
            status: 'succeeded',
            amount: 5000,
            currency: 'NGN',
            reference: 'flw-ref-1',
          },
        ],
      }),
    });

    const verified = await service.verifyTransaction('flw-ref-1', 5000);
    expect(verified).toBe(true);
  });

  it('rejects verify when amount mismatches', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        status: 'success',
        message: 'Charges fetched',
        data: [
          {
            status: 'succeeded',
            amount: 4000,
            currency: 'NGN',
            reference: 'flw-ref-1',
          },
        ],
      }),
    });

    const verified = await service.verifyTransaction('flw-ref-1', 5000);
    expect(verified).toBe(false);
  });

  it('validates webhook HMAC signature', () => {
    const rawBody = '{"type":"charge.completed"}';
    const signature = createHmac('sha256', 'webhook-secret')
      .update(rawBody)
      .digest('base64');

    expect(() => service.verifyWebhookSignature(rawBody, signature)).not.toThrow();
    expect(() => service.verifyWebhookSignature(rawBody, 'invalid')).toThrow();
  });
});

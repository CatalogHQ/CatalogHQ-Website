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

  it('parses redirect_url next_action for orchestrator charges', async () => {
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
      paymentMethod: 'ussd',
      ussdBankCode: '044',
    });

    expect(result.authorizationUrl).toBe('https://checkout.example/redirect');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/orchestration/direct-charges');
    expect(init.headers['X-Idempotency-Key']).toBeDefined();
  });

  it('creates OPay charges via customer search, create, payment method, and charge APIs', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: { id: 'cus_test_1' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: { id: 'pmd_test_1', type: 'opay' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: {
            reference: 'flw-ref-1',
            next_action: {
              type: 'redirect_url',
              redirect_url: { url: 'https://checkout.example/opay' },
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

    expect(result.authorizationUrl).toBe('https://checkout.example/opay');
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      '/customers/search',
    );
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('/customers');
    expect((global.fetch as jest.Mock).mock.calls[2][0]).toContain(
      '/payment-methods',
    );
    expect((global.fetch as jest.Mock).mock.calls[3][0]).toContain('/charges');
  });

  it('reuses an existing Flutterwave customer for OPay when search finds one', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: [{ id: 'cus_existing' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: { id: 'pmd_test_1', type: 'opay' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: {
            reference: 'flw-ref-1',
            next_action: {
              type: 'redirect_url',
              redirect_url: { url: 'https://checkout.example/opay' },
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

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      '/customers/search',
    );
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain(
      '/payment-methods',
    );
    expect((global.fetch as jest.Mock).mock.calls[2][0]).toContain('/charges');
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
      paymentMethod: 'ussd',
      ussdBankCode: '044',
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

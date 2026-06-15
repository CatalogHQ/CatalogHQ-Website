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

  it('creates bank transfer checkout via customer search and virtual account APIs', async () => {
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
          data: {
            account_number: '0123456789',
            account_bank_name: 'Wema Bank',
            note: 'Transfer exactly ₦5,000 to Wema Bank account 0123456789.',
          },
        }),
      });

    const result = await service.initializeTransaction({
      email: 'buyer8012345678@cataloghq.ng',
      phone: '08012345678',
      name: 'Ada Lovelace',
      amountNaira: 5000,
      reference: 'flw-ref-1',
      callbackPath: '/callback',
      paymentMethod: 'bank_transfer',
    });

    expect(result.authorizationUrl).toBeNull();
    expect(result.virtualAccount).toEqual({
      accountNumber: '0123456789',
      bankName: 'Wema Bank',
      expiresAt: undefined,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      '/customers/search',
    );
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain(
      '/virtual-accounts',
    );
  });

  it('reuses the same idempotency key when retrying after a 5xx', async () => {
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
            account_number: '0123456789',
            account_bank_name: 'Wema Bank',
          },
        }),
      });

    await service.initializeTransaction({
      email: 'buyer8012345678@cataloghq.ng',
      phone: '08012345678',
      name: 'Ada Lovelace',
      amountNaira: 5000,
      reference: 'flw-ref-1',
      callbackPath: '/callback',
      paymentMethod: 'bank_transfer',
    });

    expect(global.fetch).toHaveBeenCalledTimes(4);
    const virtualAccountCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call: [string]) => String(call[0]).includes('/virtual-accounts'),
    );
    expect(virtualAccountCalls).toHaveLength(2);
    const firstKey = virtualAccountCalls[0][1].headers['X-Idempotency-Key'];
    const secondKey = virtualAccountCalls[1][1].headers['X-Idempotency-Key'];
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

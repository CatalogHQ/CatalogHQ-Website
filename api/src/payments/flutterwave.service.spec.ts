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
        FLUTTERWAVE_SECRET_KEY: 'flw-secret-key',
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

  it('creates bank transfer checkout via v3 charge with vendor split', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        status: 'success',
        message: 'Charge initiated',
        data: {
          meta: {
            authorization: {
              transfer_account: '0123456789',
              transfer_bank: 'WEMA BANK',
              transfer_amount: 5000,
            },
          },
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
      subaccounts: [
        {
          id: 'RS_VENDOR_1',
          transaction_charge_type: 'flat_subaccount',
          transaction_charge: 4800,
        },
      ],
    });

    expect(result.authorizationUrl).toBeNull();
    expect(result.virtualAccount).toEqual({
      accountNumber: '0123456789',
      bankName: 'WEMA BANK',
      expiresAt: undefined,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toContain('/v3/charges?type=bank_transfer');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer flw-secret-key');

    const payload = JSON.parse(init.body) as {
      subaccounts: Array<{ id: string }>;
      tx_ref: string;
    };
    expect(payload.tx_ref).toBe('flw-ref-1');
    expect(payload.subaccounts[0]?.id).toBe('RS_VENDOR_1');
  });

  it('verifies succeeded v4 charge with matching amount', async () => {
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

  it('falls back to v3 verify when v4 charge lookup fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          message: 'Charges fetched',
          data: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          status: 'success',
          data: {
            status: 'successful',
            amount: 5150,
            currency: 'NGN',
          },
        }),
      });

    const verified = await service.verifyTransaction('flw-ref-1', 5150);
    expect(verified).toBe(true);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain(
      '/transactions/verify_by_reference',
    );
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

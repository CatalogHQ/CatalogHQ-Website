import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import { FlutterwaveTransferService } from './flutterwave-transfer.service';

describe('FlutterwaveTransferService', () => {
  const auth = {
    isConfigured: jest.fn().mockReturnValue(true),
    getAccessToken: jest.fn().mockResolvedValue('access-token'),
  };

  const configService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        FLUTTERWAVE_ENV: 'sandbox',
      };
      return values[key] ?? defaultValue;
    }),
  };

  let service: FlutterwaveTransferService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlutterwaveTransferService,
        { provide: ConfigService, useValue: configService },
        { provide: FlutterwaveAuthService, useValue: auth },
      ],
    }).compile();

    service = module.get(FlutterwaveTransferService);
  });

  it('creates NGN bank transfer recipient', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        message: 'Recipient created',
        data: {
          id: 'rcb_test123',
          type: 'bank',
          currency: 'NGN',
        },
      }),
    });

    const result = await service.createNgnBankRecipient('044', '0123456789');

    expect(result.recipientId).toBe('rcb_test123');
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toContain('/transfers/recipients');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      type: 'bank_ngn',
      bank: { code: '044', account_number: '0123456789' },
    });
  });

  it('initiates instant transfer with vendor amount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        message: 'Transfer created',
        data: {
          id: 'trf_test456',
          reference: 'payout-SHP-abc',
          status: 'NEW',
        },
      }),
    });

    const result = await service.initiateInstantTransfer({
      recipientId: 'rcb_test123',
      amountNaira: 4800,
      reference: 'payout-SHP-abc',
      narration: 'CatalogHQ order SHP-abc',
      meta: { orderId: 'order-1', paymentRef: 'SHP-abc', vendorId: 'vendor-1' },
    });

    expect(result).toEqual({
      transferId: 'trf_test456',
      reference: 'payout-SHP-abc',
      status: 'NEW',
    });

    const payload = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string,
    ) as {
      action: string;
      payment_instruction: {
        recipient_id: string;
        amount: { value: number };
      };
    };
    expect(payload.action).toBe('instant');
    expect(payload.payment_instruction.recipient_id).toBe('rcb_test123');
    expect(payload.payment_instruction.amount.value).toBe(4800);
  });

  it('rejects transfers below the minimum payout amount', async () => {
    await expect(
      service.initiateInstantTransfer({
        recipientId: 'rcb_test123',
        amountNaira: 299,
        reference: 'payout-SHP-low',
        narration: 'Too small',
      }),
    ).rejects.toThrow('Minimum payout amount is 300 NGN.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns mock recipient and transfer when OAuth is not configured', async () => {
    auth.isConfigured.mockReturnValue(false);

    const recipient = await service.createNgnBankRecipient('044', '0123456789');
    expect(recipient.recipientId).toMatch(/^rcb_MOCK_/);
    expect(global.fetch).not.toHaveBeenCalled();

    const transfer = await service.initiateInstantTransfer({
      recipientId: recipient.recipientId,
      amountNaira: 1000,
      reference: 'payout-SHP-mock',
      narration: 'Test',
    });
    expect(transfer.transferId).toBe('trf_MOCK_payout-SHP-mock');
  });

  it('fetches transfer status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          id: 'trf_test456',
          reference: 'payout-SHP-abc',
          status: 'SUCCESSFUL',
        },
      }),
    });

    const result = await service.getTransfer('trf_test456');
    expect(result.status).toBe('SUCCESSFUL');
  });
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SendChampService } from './sendchamp.service';

describe('SendChampService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  async function createService(configService: ConfigService) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendChampService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    return module.get(SendChampService);
  }

  it('skips SMS when API key is missing', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const service = await createService(configService);
    global.fetch = jest.fn();

    await service.sendSms('2348012345678', 'Hello');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends SMS when configured', async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'SENDCHAMP_API_KEY') return 'test-key';
        if (key === 'SENDCHAMP_MODE') return 'test';
        return defaultValue;
      }),
    } as unknown as ConfigService;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'sent' }),
    });

    const service = await createService(configService);
    await service.sendSms('2348012345678', 'Hello');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://sandbox-api.sendchamp.com/api/v1/sms/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });
});

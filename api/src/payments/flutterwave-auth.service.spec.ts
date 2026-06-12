import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FlutterwaveAuthService } from './flutterwave-auth.service';

describe('FlutterwaveAuthService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'FLUTTERWAVE_CLIENT_ID') return 'client-id';
      if (key === 'FLUTTERWAVE_CLIENT_SECRET') return 'client-secret';
      return undefined;
    }),
  };

  let service: FlutterwaveAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlutterwaveAuthService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(FlutterwaveAuthService);
  });

  it('reports configured when client credentials exist', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('caches access token until near expiry', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token-1',
        expires_in: 600,
      }),
    });

    const first = await service.getAccessToken();
    const second = await service.getAccessToken();

    expect(first).toBe('token-1');
    expect(second).toBe('token-1');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

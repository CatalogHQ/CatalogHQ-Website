import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AshlabNinVerificationService } from './ashlab-nin-verification.service';

describe('AshlabNinVerificationService', () => {
  let service: AshlabNinVerificationService;

  const config = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        ASHLAB_VERIFY_API_KEY: 'test-api-key',
        ASHLAB_VERIFY_BASE_URL: 'https://verify.ashlabtech.ng/v1',
        ASHLAB_VERIFY_PATH: '/nin/verify',
      };
      return values[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AshlabNinVerificationService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(AshlabNinVerificationService);
  });

  it('reports configured when API key is set', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('verifies a valid NIN', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          nin: '11111111111',
          first_name: 'John',
          last_name: 'Doe',
        },
      }),
    } as Response);

    const result = await service.verify('11111111111');

    expect(result).toEqual({
      status: 'verified',
      data: {
        nin: '11111111111',
        first_name: 'John',
        last_name: 'Doe',
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://verify.ashlabtech.ng/v1/nin/verify',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
        body: JSON.stringify({ nin: '11111111111', consent: true }),
      }),
    );
  });

  it('returns not_found for 404 responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ success: false, message: 'Identity not found' }),
    } as Response);

    const result = await service.verify('12345678901');

    expect(result.status).toBe('not_found');
  });

  it('returns unavailable when not configured', async () => {
    const unconfigured = new AshlabNinVerificationService({
      get: jest.fn(() => undefined),
    } as unknown as ConfigService);

    const result = await unconfigured.verify('11111111111');

    expect(result.status).toBe('unavailable');
  });
});

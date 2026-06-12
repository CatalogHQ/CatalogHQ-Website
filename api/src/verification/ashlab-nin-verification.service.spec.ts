import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  ASHLAB_VERIFY_DEFAULT_BASE_URL,
  ASHLAB_VERIFY_DEFAULT_PATH,
  AshlabNinVerificationService,
} from './ashlab-nin-verification.service';

describe('AshlabNinVerificationService', () => {
  let service: AshlabNinVerificationService;

  const config = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        ASHLAB_VERIFY_API_KEY: 'test-api-key',
        ASHLAB_VERIFY_BASE_URL: ASHLAB_VERIFY_DEFAULT_BASE_URL,
        ASHLAB_VERIFY_PATH: ASHLAB_VERIFY_DEFAULT_PATH,
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

  it('verifies a valid NIN from flat responses', async () => {
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
      `${ASHLAB_VERIFY_DEFAULT_BASE_URL}${ASHLAB_VERIFY_DEFAULT_PATH}`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
        body: JSON.stringify({ nin: '11111111111', consent: true }),
      }),
    );
  });

  it('verifies a valid NIN from nested live responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          _raw: {
            data: {
              firstName: 'GODWIN',
              lastName: 'ADIGUN',
              idNumber: '44370358877',
            },
          },
        },
      }),
    } as Response);

    const result = await service.verify('44370358877');

    expect(result).toEqual({
      status: 'verified',
      data: {
        nin: '44370358877',
        first_name: 'GODWIN',
        last_name: 'ADIGUN',
      },
    });
  });

  it('returns not_found for 404 NIN responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ success: false, message: 'Identity not found' }),
    } as Response);

    const result = await service.verify('12345678901');

    expect(result.status).toBe('not_found');
  });

  it('returns unavailable when Ashlab route is wrong', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        message: 'The route v1/nin/verify could not be found.',
      }),
    } as Response);

    const result = await service.verify('12345678901');

    expect(result).toMatchObject({
      status: 'unavailable',
      message: expect.stringContaining('misconfigured'),
    });
  });

  it('uses api_key:api_secret when bearer token is not set', async () => {
    const combined = new AshlabNinVerificationService({
      get: jest.fn((key: string) => {
        if (key === 'ASHLAB_VERIFY_API_KEY') return 'key-123';
        if (key === 'ASHLAB_VERIFY_API_SECRET') return 'secret-456';
        if (key === 'ASHLAB_VERIFY_BASE_URL') return ASHLAB_VERIFY_DEFAULT_BASE_URL;
        if (key === 'ASHLAB_VERIFY_PATH') return ASHLAB_VERIFY_DEFAULT_PATH;
        return undefined;
      }),
    } as unknown as ConfigService);

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { nin: '11111111111', first_name: 'A', last_name: 'B' },
      }),
    } as Response);

    await combined.verify('11111111111');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer key-123:secret-456',
        }),
      }),
    );
  });

  it('returns unavailable when not configured', async () => {
    const unconfigured = new AshlabNinVerificationService({
      get: jest.fn(() => undefined),
    } as unknown as ConfigService);

    const result = await unconfigured.verify('11111111111');

    expect(result.status).toBe('unavailable');
  });
});

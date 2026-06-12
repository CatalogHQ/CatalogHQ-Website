import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Pingram } from 'pingram';
import { PingramEmailService } from './pingram-email.service';

jest.mock('pingram', () => {
  const send = jest.fn();
  return {
    Pingram: jest.fn().mockImplementation(() => ({ send })),
    __sendMock: send,
  };
});

const { __sendMock: sendMock } = jest.requireMock('pingram') as {
  __sendMock: jest.Mock;
};

describe('PingramEmailService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  async function createService(config: Record<string, string | undefined>) {
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key in config) return config[key];
        return defaultValue;
      }),
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingramEmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    return module.get(PingramEmailService);
  }

  it('reports not configured when Pingram API key is missing', async () => {
    const service = await createService({});
    expect(service.isConfigured()).toBe(false);
  });

  it('skips email when not configured', async () => {
    const service = await createService({});
    await service.sendEmail('a@example.com', 'Hi', '<p>Hi</p>');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('throws when required email is not configured', async () => {
    const service = await createService({});
    await expect(
      service.sendEmail('a@example.com', 'Hi', '<p>Hi</p>', undefined, {
        required: true,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('sends email via Pingram when configured', async () => {
    sendMock.mockResolvedValue({ trackingId: 'msg-1' });

    const service = await createService({
      PINGRAM_API_KEY: 'pingram_sk_test',
      PINGRAM_BASE_URL: 'https://api.pingram.io',
      PINGRAM_FROM_EMAIL: 'noreply@cataloghq.store',
      PINGRAM_FROM_NAME: 'CatalogHQ',
    });

    expect(service.isConfigured()).toBe(true);
    await service.sendEmail('vendor@example.com', 'Verify', '<p>Code</p>');

    expect(Pingram).toHaveBeenCalledWith({
      apiKey: 'pingram_sk_test',
      baseUrl: 'https://api.pingram.io',
    });
    expect(sendMock).toHaveBeenCalledWith({
      type: 'verification_code',
      to: { email: 'vendor@example.com' },
      email: {
        subject: 'Verify',
        html: '<p>Code</p>',
        senderName: 'CatalogHQ',
        senderEmail: 'noreply@cataloghq.store',
      },
    });
  });
});

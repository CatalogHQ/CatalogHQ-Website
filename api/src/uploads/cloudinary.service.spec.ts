import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  async function createService(configService: ConfigService) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    return module.get(CloudinaryService);
  }

  it('reports not configured when env vars are missing', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const service = await createService(configService);
    expect(service.isConfigured()).toBe(false);
  });

  it('throws when uploading without configuration', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const service = await createService(configService);

    await expect(
      service.uploadImage(Buffer.from('test'), 'cataloghq/products/vendor-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

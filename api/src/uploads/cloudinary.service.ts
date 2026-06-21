import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.configured = true;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async uploadImage(
    buffer: Buffer,
    folder: string,
    filename?: string,
  ): Promise<string> {
    if (!this.configured) {
      throw new InternalServerErrorException(
        'Image uploads are not configured. Set Cloudinary environment variables.',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto:good',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result?.secure_url) {
            this.logger.error('Cloudinary upload failed', error);
            reject(
              new InternalServerErrorException('Could not upload image.'),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }
}

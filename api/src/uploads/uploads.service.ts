import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

const MAX_FILE_SIZE = 500 * 1024;

function detectImageMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  validateFile(file?: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File is too large. Maximum size is 500KB.');
    }
  }

  async validateFileContent(file: Express.Multer.File): Promise<void> {
    this.validateFile(file);

    const detectedMime = detectImageMime(file.buffer);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!detectedMime || !allowedTypes.includes(detectedMime)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      );
    }

    if (detectedMime === 'image/svg+xml') {
      throw new BadRequestException('SVG files are not allowed');
    }
  }

  async uploadProductImage(
    file: Express.Multer.File,
    vendorId: string,
  ): Promise<string> {
    await this.validateFileContent(file);

    const baseFolder = this.configService.get<string>(
      'CLOUDINARY_FOLDER',
      'cataloghq/products',
    );
    const folder = `${baseFolder}/${vendorId}`;

    return this.cloudinaryService.uploadImage(file.buffer, folder);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

const MAX_FILE_SIZE = 500 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

    if (!ACCEPTED_TYPES.has(file.mimetype)) {
      throw new BadRequestException('File must be a JPG, PNG, or WebP image.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File is too large. Maximum size is 500KB.');
    }
  }

  async uploadProductImage(
    file: Express.Multer.File,
    vendorId: string,
  ): Promise<string> {
    this.validateFile(file);

    const baseFolder = this.configService.get<string>(
      'CLOUDINARY_FOLDER',
      'cataloghq/products',
    );
    const folder = `${baseFolder}/${vendorId}`;

    return this.cloudinaryService.uploadImage(file.buffer, folder);
  }
}

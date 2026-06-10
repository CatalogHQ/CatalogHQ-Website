import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Throttle({ checkout: { limit: 20, ttl: 60_000 } })
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 },
    }),
  )
  async uploadProductImage(
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const url = await this.uploadsService.uploadProductImage(file!, user.id);
    return { url };
  }
}

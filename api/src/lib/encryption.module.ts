import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeEncryptionKeys } from './encryption-keys';

@Global()
@Module({})
export class EncryptionModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    initializeEncryptionKeys(this.configService);
  }
}

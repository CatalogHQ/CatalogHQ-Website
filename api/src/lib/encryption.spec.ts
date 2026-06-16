import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { initializeEncryptionKeys } from './encryption-keys';
import { encryptNIN, decryptNIN } from './encryption';

describe('encryption', () => {
  beforeAll(() => {
    const configService = {
      get: (key: string) => {
        if (key === 'NIN_ENCRYPTION_KEY') {
          return 'a'.repeat(64);
        }
        if (key === 'TOTP_ENCRYPTION_KEY') {
          return 'b'.repeat(64);
        }
        return undefined;
      },
    } as ConfigService;

    initializeEncryptionKeys(configService);
  });

  it('encrypts and decrypts NIN values', () => {
    const encrypted = encryptNIN('12345678901');
    expect(encrypted).not.toBe('12345678901');
    expect(decryptNIN(encrypted)).toBe('12345678901');
  });
});

import { ConfigService } from '@nestjs/config';

let ninKey: Buffer | null = null;
let totpKey: Buffer | null = null;

function readHexKeyFromConfig(
  configService: ConfigService,
  envName: string,
  fallbackEnvName?: string,
): Buffer {
  const primary = configService.get<string>(envName)?.trim();
  const fallback = fallbackEnvName
    ? configService.get<string>(fallbackEnvName)?.trim()
    : undefined;
  const key = primary || fallback;

  if (!key || key.length !== 64) {
    throw new Error(
      `${envName}${fallbackEnvName ? ` or ${fallbackEnvName}` : ''} must be a 64-character hex string (32 bytes)`,
    );
  }

  return Buffer.from(key, 'hex');
}

/** Initialize encryption keys from validated Nest config (call once at boot). */
export function initializeEncryptionKeys(configService: ConfigService): void {
  ninKey = readHexKeyFromConfig(configService, 'NIN_ENCRYPTION_KEY');
  totpKey = readHexKeyFromConfig(
    configService,
    'TOTP_ENCRYPTION_KEY',
    'NIN_ENCRYPTION_KEY',
  );
}

/** CLI/scripts without Nest bootstrap. */
export function initializeEncryptionKeysFromEnv(env: NodeJS.ProcessEnv): void {
  const read = (name: string, fallback?: string): Buffer => {
    const primary = env[name]?.trim();
    const value = primary || (fallback ? env[fallback]?.trim() : undefined);
    if (!value || value.length !== 64) {
      throw new Error(`${name} must be a 64-character hex string (32 bytes)`);
    }
    return Buffer.from(value, 'hex');
  };

  ninKey = read('NIN_ENCRYPTION_KEY');
  totpKey = read('TOTP_ENCRYPTION_KEY', 'NIN_ENCRYPTION_KEY');
}

export function getNinEncryptionKey(): Buffer {
  if (!ninKey) {
    throw new Error('Encryption keys are not initialized');
  }
  return ninKey;
}

export function getTotpEncryptionKey(): Buffer {
  if (!totpKey) {
    throw new Error('Encryption keys are not initialized');
  }
  return totpKey;
}

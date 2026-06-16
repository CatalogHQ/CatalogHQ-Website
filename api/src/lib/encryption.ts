import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function readHexKey(envName: string, fallbackEnvName?: string): Buffer {
  const primary = process.env[envName]?.trim();
  const fallback = fallbackEnvName
    ? process.env[fallbackEnvName]?.trim()
    : undefined;
  const key = primary || fallback;
  if (!key || key.length !== 64) {
    throw new Error(
      `${envName}${fallbackEnvName ? ` or ${fallbackEnvName}` : ''} must be a 64-character hex string (32 bytes)`,
    );
  }
  return Buffer.from(key, 'hex');
}

function getNinKey(): Buffer {
  return readHexKey('NIN_ENCRYPTION_KEY');
}

function getTotpKey(): Buffer {
  return readHexKey('TOTP_ENCRYPTION_KEY', 'NIN_ENCRYPTION_KEY');
}

function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptWithKey(encryptedValue: string, key: Buffer): string {
  const [ivHex, tagHex, dataHex] = encryptedValue.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted value format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

export function encryptNIN(plaintext: string): string {
  return encryptWithKey(plaintext, getNinKey());
}

export function decryptNIN(encryptedValue: string): string {
  return decryptWithKey(encryptedValue, getNinKey());
}

export function encryptTotpSecret(plaintext: string): string {
  return encryptWithKey(plaintext, getTotpKey());
}

export function decryptTotpSecret(encryptedValue: string): string {
  return decryptWithKey(encryptedValue, getTotpKey());
}

export function hashNIN(plaintext: string): string {
  return createHmac('sha256', getNinKey())
    .update(plaintext)
    .digest('hex');
}

export function maskNIN(nin: string): string {
  const digits = nin.replace(/\D/g, '');
  if (digits.length < 5) return '****';
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`;
}

export function isEncryptedNIN(value: string): boolean {
  return value.includes(':') && value.split(':').length === 3;
}

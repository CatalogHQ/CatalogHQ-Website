import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.NIN_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'NIN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
    );
  }
  return Buffer.from(key, 'hex');
}

export function encryptNIN(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptNIN(encryptedValue: string): string {
  const [ivHex, tagHex, dataHex] = encryptedValue.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted NIN format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

export function hashNIN(plaintext: string): string {
  const key = process.env.NIN_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'NIN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
    );
  }
  return createHmac('sha256', Buffer.from(key, 'hex'))
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

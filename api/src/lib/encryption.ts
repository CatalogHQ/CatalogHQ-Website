import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';
import {
  getNinEncryptionKey,
  getTotpEncryptionKey,
} from './encryption-keys';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

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
  return encryptWithKey(plaintext, getNinEncryptionKey());
}

export function decryptNIN(encryptedValue: string): string {
  return decryptWithKey(encryptedValue, getNinEncryptionKey());
}

export function encryptTotpSecret(plaintext: string): string {
  return encryptWithKey(plaintext, getTotpEncryptionKey());
}

export function decryptTotpSecret(encryptedValue: string): string {
  return decryptWithKey(encryptedValue, getTotpEncryptionKey());
}

export function hashNIN(plaintext: string): string {
  return createHmac('sha256', getNinEncryptionKey())
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

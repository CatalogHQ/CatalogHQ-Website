import { ConfigService } from '@nestjs/config';

export function isNinVerifyDebugEnabled(
  configService: ConfigService,
): boolean {
  if (configService.get<string>('ASHLAB_VERIFY_DEBUG') === 'true') {
    return true;
  }

  return configService.get<string>('NODE_ENV') !== 'production';
}

export function maskNin(nin: string): string {
  const digits = nin.replace(/\D/g, '');
  if (digits.length < 6) {
    return '***';
  }

  return `${digits.slice(0, 3)}*****${digits.slice(-2)}`;
}

export function describeAshlabAuthMode(
  configService: ConfigService,
): 'bearer_token' | 'api_key_and_secret' | 'api_key_only' | 'none' {
  if (configService.get<string>('ASHLAB_VERIFY_BEARER_TOKEN')?.trim()) {
    return 'bearer_token';
  }

  const apiKey = configService.get<string>('ASHLAB_VERIFY_API_KEY')?.trim();
  const apiSecret = configService.get<string>('ASHLAB_VERIFY_API_SECRET')?.trim();

  if (apiKey && apiSecret) {
    return 'api_key_and_secret';
  }

  if (apiKey) {
    return 'api_key_only';
  }

  return 'none';
}

export function sanitizeAshlabResponseBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const copy = { ...(body as Record<string, unknown>) };

  if (copy.data && typeof copy.data === 'object') {
    const data = { ...(copy.data as Record<string, unknown>) };
    if ('photo' in data) {
      data.photo = '[redacted]';
    }
    copy.data = data;
  }

  return copy;
}

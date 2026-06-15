import { RawBodyRequest } from '@nestjs/common';

export function getFlutterwaveWebhookRawBody(
  req: RawBodyRequest<Request>,
  parsedBody: unknown,
): string {
  const raw = req.rawBody;

  if (Buffer.isBuffer(raw)) {
    return raw.toString('utf8');
  }

  if (typeof raw === 'string') {
    return raw;
  }

  if (parsedBody && typeof parsedBody === 'object') {
    return JSON.stringify(parsedBody);
  }

  return '';
}

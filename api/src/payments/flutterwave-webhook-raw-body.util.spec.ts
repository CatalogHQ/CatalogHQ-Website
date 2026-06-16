import { BadRequestException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { getFlutterwaveWebhookRawBody } from './flutterwave-webhook-raw-body.util';

describe('flutterwave-webhook-raw-body.util', () => {
  it('returns buffer raw body as utf8', () => {
    const rawBody = Buffer.from('{"event":"charge.completed"}', 'utf8');
    expect(
      getFlutterwaveWebhookRawBody({ rawBody } as RawBodyRequest<Request>),
    ).toBe('{"event":"charge.completed"}');
  });

  it('throws when raw body is missing', () => {
    expect(() =>
      getFlutterwaveWebhookRawBody({ rawBody: undefined } as RawBodyRequest<Request>),
    ).toThrow(BadRequestException);
  });
});

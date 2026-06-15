import { getFlutterwaveWebhookRawBody } from './flutterwave-webhook-raw-body.util';

describe('getFlutterwaveWebhookRawBody', () => {
  it('reads utf8 from Buffer rawBody', () => {
    const payload = '{"type":"charge.completed","id":"wbk_1"}';
    const rawBody = getFlutterwaveWebhookRawBody(
      { rawBody: Buffer.from(payload, 'utf8') } as never,
      {},
    );

    expect(rawBody).toBe(payload);
  });

  it('falls back to string rawBody', () => {
    expect(
      getFlutterwaveWebhookRawBody(
        { rawBody: '{"type":"charge.completed"}' } as never,
        {},
      ),
    ).toBe('{"type":"charge.completed"}');
  });
});

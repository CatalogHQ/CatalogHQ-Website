import { BadRequestException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';

export class MissingWebhookRawBodyError extends BadRequestException {
  constructor() {
    super('Missing raw webhook body for signature verification.');
  }
}

export function getFlutterwaveWebhookRawBody(
  req: RawBodyRequest<Request>,
): string {
  const raw = req.rawBody;

  if (Buffer.isBuffer(raw)) {
    return raw.toString('utf8');
  }

  throw new MissingWebhookRawBodyError();
}

import { SendChampWebhookService } from './sendchamp-webhook.service';

describe('SendChampWebhookService', () => {
  let service: SendChampWebhookService;

  beforeEach(() => {
    service = new SendChampWebhookService();
  });

  it('handles SMS delivered events without throwing', () => {
    expect(() =>
      service.handleDeliveryEvent({
        service: 'sms',
        status: 'delivered',
        phone_number: '+2348031234567',
        sms_uid: 'uid-1',
        reference: 'ref-1',
      }),
    ).not.toThrow();
  });

  it('handles email failure events without throwing', () => {
    expect(() =>
      service.handleDeliveryEvent({
        service: 'email',
        status: 'failed',
        email: 'vendor@example.com',
        email_uid: 'uid-2',
        message: 'Mailbox not found',
      }),
    ).not.toThrow();
  });
});

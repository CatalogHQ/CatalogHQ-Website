import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { PayoutSettledEvent } from '../payments/events/payout-settled.event';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsListener } from './notifications.listener';
import { PingramEmailService } from './pingram-email.service';
import { SmsService } from './sms.service';

describe('NotificationsListener', () => {
  let listener: NotificationsListener;
  let smsService: { sendSms: jest.Mock };
  let emailService: { sendEmail: jest.Mock };
  let prisma: { order: { findUnique: jest.Mock } };
  let configService: { get: jest.Mock };

  const mockOrder = {
    id: 'order-1',
    paymentRef: 'SHP-ABC123',
    productName: 'Blue Gown',
    quantity: 2,
    unitPrice: 7500,
    deliveryFee: 0,
    discountAmount: 0,
    totalPaid: 15306,
    customerName: 'Ada Okonkwo',
    store: {
      businessName: 'Ada Fashion',
      whatsapp: '2348012345678',
      vendor: {
        email: 'vendor@example.com',
      },
    },
  };

  beforeEach(async () => {
    smsService = { sendSms: jest.fn().mockResolvedValue(undefined) };
    emailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(mockOrder),
      },
    };
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'FLUTTERWAVE_CALLBACK_BASE_URL') {
          return 'https://cataloghq.store';
        }
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsListener,
        { provide: SmsService, useValue: smsService },
        { provide: PingramEmailService, useValue: emailService },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        {
          provide: PlanEntitlementService,
          useValue: { hasFeature: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    listener = module.get(NotificationsListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends SMS and email when a paid order is created', async () => {
    await listener.handleOrderCreated(new OrderCreatedEvent('order-1'));

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      include: { store: { include: { vendor: true } } },
    });
    expect(smsService.sendSms).toHaveBeenCalledWith(
      '2348012345678',
      expect.stringContaining('you receive 15000 NGN'),
    );
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      'vendor@example.com',
      'New order SHP-ABC123 at Ada Fashion',
      expect.stringContaining('Ada Okonkwo'),
      'Ada Fashion',
      { type: 'order_created' },
    );
    const emailBody = emailService.sendEmail.mock.calls[0][2] as string;
    expect(emailBody).toContain('Hi, Ada Fashion,');
    expect(emailBody).toContain('You receive:</strong> 15000 NGN');
    expect(emailBody).not.toContain('Customer paid');
  });

  it('sends email but skips SMS when whatsapp is missing', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      store: {
        ...mockOrder.store,
        whatsapp: '',
      },
    });

    await listener.handleOrderCreated(new OrderCreatedEvent('order-1'));

    expect(smsService.sendSms).not.toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalled();
  });

  it('sends SMS but skips email when vendor email is missing', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      store: {
        ...mockOrder.store,
        vendor: { email: '' },
      },
    });

    await listener.handleOrderCreated(new OrderCreatedEvent('order-1'));

    expect(smsService.sendSms).toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('sends SMS and email when a payout is settled', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      vendorNet: 15000,
    });

    await listener.handlePayoutSettled(new PayoutSettledEvent('order-1'));

    expect(smsService.sendSms).toHaveBeenCalledWith(
      '2348012345678',
      expect.stringContaining('15000 NGN'),
    );
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      'vendor@example.com',
      'Payout sent for order SHP-ABC123',
      expect.stringContaining('15000 NGN'),
      'Ada Fashion',
      { type: 'payout_settled' },
    );
    const payoutEmailBody = emailService.sendEmail.mock.calls[0][2] as string;
    expect(payoutEmailBody).toContain('Hi, Ada Fashion,');
  });
});

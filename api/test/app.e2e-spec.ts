import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PingramEmailService } from '../src/notifications/pingram-email.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const vendorAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const vendorBOrderId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    store: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    product: { findFirst: jest.fn() },
    order: {
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    supportTicket: { count: jest.fn(), findMany: jest.fn() },
    emailOtp: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    otpSendLog: { count: jest.fn(), create: jest.fn() },
    otpSendLock: { findUnique: jest.fn(), upsert: jest.fn() },
    otpIpSendLock: { findUnique: jest.fn(), upsert: jest.fn() },
    planCatalogEntry: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
  };

  const emailService = {
    isConfigured: jest.fn().mockReturnValue(true),
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(PingramEmailService)
      .useValue(emailService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    emailService.isConfigured.mockReturnValue(true);
  });

  it('GET /health is public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /health/ready checks database', async () => {
    await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('GET /auth/me requires authentication', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /admin/stats requires admin role', async () => {
    await request(app.getHttpServer()).get('/admin/stats').expect(401);
  });

  it('POST /auth/forgot-password returns success for known vendors', async () => {
    prisma.otpIpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLog.count.mockResolvedValue(0);
    prisma.otpSendLog.create.mockResolvedValue({ id: 'log-1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'vendor@example.com',
    });
    prisma.emailOtp.updateMany.mockResolvedValue({ count: 0 });
    prisma.emailOtp.create.mockResolvedValue({ id: 'otp-1' });

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'vendor@example.com' })
      .expect(201);

    expect(emailService.sendEmail).toHaveBeenCalled();
  });

  it('POST /auth/forgot-password returns success for unknown emails', async () => {
    prisma.otpIpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLock.findUnique.mockResolvedValue(null);
    prisma.otpSendLog.count.mockResolvedValue(0);
    prisma.otpSendLog.create.mockResolvedValue({ id: 'log-2' });
    prisma.user.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'missing@example.com' })
      .expect(201);

    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('POST /orders rejects extra pricing fields', async () => {
    prisma.store.findUnique.mockResolvedValue({
      vendorId: '11111111-1111-1111-1111-111111111111',
      setupComplete: true,
      vendor: { planTier: 'starter' },
    });
    prisma.product.findFirst.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      price: 1000,
      stock: 5,
      deliveryOptions: ['pickup'],
    });

    await request(app.getHttpServer())
      .post('/orders')
      .send({
        storeId: '11111111-1111-1111-1111-111111111111',
        productId: '22222222-2222-2222-2222-222222222222',
        productName: 'Shirt',
        quantity: 1,
        deliveryType: 'pickup',
        unitPrice: 1,
        totalPaid: 1,
        customerName: 'Ada',
        customerPhone: '08012345678',
      })
      .expect(400);
  });

  it('PATCH /stores/me/orders/:id/status rejects cross-vendor order access', async () => {
    const token = jwtService.sign({ sub: vendorAId });

    prisma.user.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === vendorAId) {
        return Promise.resolve({
          id: vendorAId,
          email: 'vendor-a@example.com',
          role: 'vendor',
          planTier: 'starter',
          subscriptionExempt: true,
          subscription: null,
        });
      }
      return Promise.resolve(null);
    });
    prisma.order.findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .patch(`/stores/me/orders/${vendorBOrderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'delivered' })
      .expect(404);
  });
});

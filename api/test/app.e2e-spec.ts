import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
    store: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    product: { findFirst: jest.fn() },
    order: {
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    supportTicket: { count: jest.fn(), findMany: jest.fn() },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
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
  });

  afterAll(async () => {
    await app.close();
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
});

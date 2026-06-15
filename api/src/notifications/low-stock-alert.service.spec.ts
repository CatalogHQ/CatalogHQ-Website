import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { LOW_STOCK_EVENT } from '../orders/events/order.events';
import { LowStockAlertService } from './low-stock-alert.service';

describe('LowStockAlertService', () => {
  const prisma = {
    store: { findUnique: jest.fn() },
  };
  const planEntitlementService = {
    hasFeature: jest.fn().mockResolvedValue(true),
  };
  const eventEmitter = {
    emit: jest.fn(),
  };

  let service: LowStockAlertService;

  beforeEach(async () => {
    jest.clearAllMocks();
    planEntitlementService.hasFeature.mockResolvedValue(true);
    prisma.store.findUnique.mockResolvedValue({
      whatsapp: '08012345678',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LowStockAlertService,
        { provide: PrismaService, useValue: prisma },
        { provide: PlanEntitlementService, useValue: planEntitlementService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(LowStockAlertService);
  });

  it('alerts when stock first reaches the threshold', async () => {
    await service.notifyIfNeeded(
      'store-1',
      { name: 'Shirt', stock: 2, lowStockThreshold: 2 },
      5,
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      LOW_STOCK_EVENT,
      expect.objectContaining({
        productName: 'Shirt',
        stock: 2,
      }),
    );
  });

  it('alerts when a product is saved already at the threshold', async () => {
    await service.notifyIfNeeded('store-1', {
      name: 'Shirt',
      stock: 2,
      lowStockThreshold: 2,
    });

    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('does not re-alert while stock stays low', async () => {
    await service.notifyIfNeeded(
      'store-1',
      { name: 'Shirt', stock: 2, lowStockThreshold: 2 },
      2,
    );

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('skips vendors without the low-stock feature', async () => {
    planEntitlementService.hasFeature.mockResolvedValue(false);

    await service.notifyIfNeeded('store-1', {
      name: 'Shirt',
      stock: 2,
      lowStockThreshold: 2,
    });

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});

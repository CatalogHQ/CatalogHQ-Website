import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { LOW_STOCK_EVENT } from '../orders/events/order.events';
import { LowStockEvent } from '../orders/events/low-stock.event';

type LowStockProductSnapshot = {
  name: string;
  stock: number;
  lowStockThreshold: number;
};

@Injectable()
export class LowStockAlertService {
  private readonly logger = new Logger(LowStockAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planEntitlementService: PlanEntitlementService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  isLowStock(product: LowStockProductSnapshot): boolean {
    return product.stock > 0 && product.stock <= product.lowStockThreshold;
  }

  shouldNotify(
    product: LowStockProductSnapshot,
    previousStock?: number,
  ): boolean {
    if (!this.isLowStock(product)) {
      return false;
    }

    if (previousStock === undefined) {
      return true;
    }

    return previousStock > product.lowStockThreshold;
  }

  async notifyIfNeeded(
    storeId: string,
    product: LowStockProductSnapshot,
    previousStock?: number,
  ): Promise<void> {
    if (!this.shouldNotify(product, previousStock)) {
      return;
    }

    const hasFeature = await this.planEntitlementService.hasFeature(
      storeId,
      'low-stock-alerts',
    );
    if (!hasFeature) {
      return;
    }

    const store = await this.prisma.store.findUnique({
      where: { vendorId: storeId },
    });
    if (!store?.whatsapp) {
      this.logger.warn(
        `Low-stock alert skipped for ${product.name}: store WhatsApp missing.`,
      );
      return;
    }

    this.eventEmitter.emit(
      LOW_STOCK_EVENT,
      new LowStockEvent(store.whatsapp, product.name, product.stock),
    );
  }
}

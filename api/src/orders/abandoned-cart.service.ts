import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { normalizePhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import { AbandonedCartDto } from './dto/abandoned-cart.dto';
import { ABANDONED_CART_EVENT } from './events/order.events';
import { AbandonedCartEvent } from './events/abandoned-cart.event';

const MAX_CARTS_PER_PHONE_STORE_HOUR = 5;

@Injectable()
export class AbandonedCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async track(body: AbandonedCartDto) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: body.storeId },
      select: { vendorId: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    const product = await this.prisma.product.findFirst({
      where: { id: body.productId, storeId: body.storeId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (body.customerPhone) {
      const normalizedPhone = normalizePhone(body.customerPhone);
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await this.prisma.abandonedCart.count({
        where: {
          storeId: body.storeId,
          customerPhone: normalizedPhone,
          createdAt: { gte: since },
        },
      });

      if (recentCount >= MAX_CARTS_PER_PHONE_STORE_HOUR) {
        throw new BadRequestException(
          'Too many cart reminders for this phone number. Try again later.',
        );
      }

      body.customerPhone = normalizedPhone;
    }

    const cart = await this.prisma.abandonedCart.create({
      data: {
        storeId: body.storeId,
        productId: body.productId,
        customerPhone: body.customerPhone,
        customerName: body.customerName,
        cartData: body.cartData as Prisma.InputJsonValue,
      },
    });

    if (body.customerPhone) {
      this.eventEmitter.emit(
        ABANDONED_CART_EVENT,
        new AbandonedCartEvent(cart.id, body.customerPhone, body.storeId),
      );
    }

    return { id: cart.id };
  }
}

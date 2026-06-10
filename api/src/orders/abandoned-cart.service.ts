import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AbandonedCartDto } from './dto/abandoned-cart.dto';
import { ABANDONED_CART_EVENT } from './events/order.events';
import { AbandonedCartEvent } from './events/abandoned-cart.event';

@Injectable()
export class AbandonedCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async track(body: AbandonedCartDto) {
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

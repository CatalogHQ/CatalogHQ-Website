import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ORDER_DELIVERED_EVENT } from '../orders/events/order.events';
import { OrderDeliveredEvent } from '../orders/events/order-delivered.event';
import { ReviewsService } from './reviews.service';

@Injectable()
export class ReviewsListener {
  constructor(private readonly reviewsService: ReviewsService) {}

  @OnEvent(ORDER_DELIVERED_EVENT)
  async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
    await this.reviewsService.syncVerifiedReviewForDeliveredOrder(event.orderId);
  }
}

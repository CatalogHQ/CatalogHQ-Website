import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { PaymentRefPipe } from '../common/pipes/payment-ref.pipe';
import { OrderRefQueryDto } from '../orders/dto/order-ref-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('stores/public/:slug/reviews')
@Public()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('summary')
  summary(@Param('slug') slug: string) {
    return this.reviewsService.getSummaryByStoreSlug(slug);
  }

  @Get()
  list(@Param('slug') slug: string) {
    return this.reviewsService.listByStoreSlug(slug);
  }
}

@Controller('orders/ref/:paymentRef/reviews')
@Public()
export class OrderReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('status')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  status(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() body: OrderRefQueryDto,
  ) {
    return this.reviewsService.getOrderReviewStatus(paymentRef, body.phone);
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createForOrder(paymentRef, dto);
  }
}

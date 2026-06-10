import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PaymentRefPipe } from '../common/pipes/payment-ref.pipe';
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

  @Post()
  create(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createForOrder(paymentRef, dto);
  }
}

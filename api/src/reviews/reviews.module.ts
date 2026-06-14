import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { StoresModule } from '../stores/stores.module';
import { OrderReviewsController, ReviewsController } from './reviews.controller';
import { ReviewsListener } from './reviews.listener';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [StoresModule, PlansModule],
  controllers: [ReviewsController, OrderReviewsController],
  providers: [ReviewsService, ReviewsListener],
  exports: [ReviewsService],
})
export class ReviewsModule {}

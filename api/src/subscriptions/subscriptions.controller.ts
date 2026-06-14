import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipSubscriptionGuard } from '../common/decorators/plan-access.decorator';
import { SubscriptionCheckoutDto } from './dto/subscription-checkout.dto';
import { VendorSubscriptionService } from './vendor-subscription.service';

@Controller('subscriptions')
@SkipSubscriptionGuard()
export class SubscriptionsController {
  constructor(
    private readonly vendorSubscriptionService: VendorSubscriptionService,
  ) {}

  @Get('me')
  getMine(@CurrentUser() user: User) {
    return this.vendorSubscriptionService.getSubscription(user.id);
  }

  @Get('payments')
  listPayments(@CurrentUser() user: User) {
    return this.vendorSubscriptionService.listPayments(user.id);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: User, @Body() dto: SubscriptionCheckoutDto) {
    return this.vendorSubscriptionService.startCheckout(
      user.id,
      user.email,
      dto,
    );
  }

  @Post('cancel')
  cancel(@CurrentUser() user: User) {
    return this.vendorSubscriptionService.cancelAtPeriodEnd(user.id);
  }

  @Post('change-plan')
  changePlan(@CurrentUser() user: User, @Body() dto: SubscriptionCheckoutDto) {
    return this.vendorSubscriptionService.changePlan(
      user.id,
      user.email,
      dto,
    );
  }
}

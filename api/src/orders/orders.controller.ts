import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequireFeature } from '../common/decorators/plan-access.decorator';
import { CustomerPhoneParamPipe } from '../common/pipes/customer-phone.param.pipe';
import { PaymentRefPipe } from '../common/pipes/payment-ref.pipe';
import { AbandonedCartService } from './abandoned-cart.service';
import { AbandonedCartDto } from './dto/abandoned-cart.dto';
import { BulkUpdateOrdersDto } from './dto/bulk-update-orders.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkTransferReferenceDto } from './dto/mark-transfer-reference.dto';
import { OrderRefQueryDto } from './dto/order-ref-query.dto';
import { ReserveOrderDto } from './dto/reserve-order.dto';
import { SearchOrdersQueryDto } from './dto/search-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly abandonedCartService: AbandonedCartService,
  ) {}

  @Public()
  @Throttle({ checkout: { limit: 20, ttl: 60_000 } })
  @Post('orders/checkout')
  checkout(@Body() dto: CheckoutOrderDto) {
    const { storeSlug, ...checkout } = dto;
    return this.ordersService.checkout(checkout, storeSlug);
  }

  @Public()
  @Throttle({ checkout: { limit: 20, ttl: 60_000 } })
  @Post('orders')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Public()
  @Throttle({ checkout: { limit: 10, ttl: 60_000 } })
  @Post('orders/reserve')
  reserve(@Body() dto: ReserveOrderDto) {
    return this.ordersService.reserve(dto);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('orders/abandoned-cart')
  trackAbandonedCart(@Body() dto: AbandonedCartDto) {
    return this.abandonedCartService.track(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('orders/ref/:paymentRef')
  async getByPaymentRef(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Query() query: OrderRefQueryDto,
  ) {
    const order = await this.ordersService.getByPaymentRef(
      paymentRef,
      query.phone,
    );
    return { order };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('orders/ref/:paymentRef/verify')
  async verifyPayment(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Query() query: OrderRefQueryDto,
  ) {
    const order = await this.ordersService.verifyPayment(
      paymentRef,
      query.phone,
    );
    return { order };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('orders/ref/:paymentRef/receipt')
  getReceipt(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Query() query: OrderRefQueryDto,
  ) {
    return this.ordersService.getReceipt(paymentRef, query.phone);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Patch('orders/ref/:paymentRef/transfer')
  markTransfer(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() dto: MarkTransferReferenceDto,
  ) {
    return this.ordersService.markTransferReference(
      paymentRef,
      dto.transferReference,
      dto.phoneLastFour,
    );
  }

  @Get('stores/me/orders')
  @RequireFeature('order-management')
  listMine(
    @CurrentUser() user: User,
    @Query() query: SearchOrdersQueryDto,
  ) {
    return this.ordersService.listByStoreId(user.id, query.q);
  }

  @Get('stores/me/orders/unread-count')
  async unreadCount(@CurrentUser() user: User) {
    const count = await this.ordersService.getUnreadCount(user.id);
    return { count };
  }

  @Patch('stores/me/orders/:orderId/status')
  @RequireFeature('order-management')
  updateStatus(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      user.id,
      orderId,
      dto.status,
      user.id,
    );
  }

  @Post('stores/me/orders/bulk-status')
  @RequireFeature('order-search')
  bulkUpdateStatus(
    @CurrentUser() user: User,
    @Body() dto: BulkUpdateOrdersDto,
  ) {
    return this.ordersService.bulkUpdateStatus(
      user.id,
      dto.orderIds,
      dto.status,
      user.id,
    );
  }

  @Get('stores/me/orders/customer-count/:phone')
  customerOrderCount(
    @CurrentUser() user: User,
    @Param('phone', CustomerPhoneParamPipe) phone: string,
  ) {
    return this.ordersService.getCustomerOrderCount(user.id, phone);
  }

  @Post('stores/me/orders/mark-seen')
  async markSeen(@CurrentUser() user: User) {
    await this.ordersService.markAllSeen(user.id);
    return { success: true };
  }
}

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
import { CustomerPhoneParamPipe } from '../common/pipes/customer-phone.param.pipe';
import { PaymentRefPipe } from '../common/pipes/payment-ref.pipe';
import { AbandonedCartService } from './abandoned-cart.service';
import { AbandonedCartDto } from './dto/abandoned-cart.dto';
import { BulkUpdateOrdersDto } from './dto/bulk-update-orders.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkTransferReferenceDto } from './dto/mark-transfer-reference.dto';
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
  @Get('orders/ref/:paymentRef')
  async getByPaymentRef(@Param('paymentRef', PaymentRefPipe) paymentRef: string) {
    const order = await this.ordersService.getByPaymentRef(paymentRef);
    return { order };
  }

  @Public()
  @Throttle({ checkout: { limit: 10, ttl: 60_000 } })
  @Post('orders/ref/:paymentRef/verify')
  async verifyPayment(@Param('paymentRef', PaymentRefPipe) paymentRef: string) {
    const order = await this.ordersService.verifyPayment(paymentRef);
    return { order };
  }

  @Public()
  @Get('orders/ref/:paymentRef/receipt')
  getReceipt(@Param('paymentRef', PaymentRefPipe) paymentRef: string) {
    return this.ordersService.getReceipt(paymentRef);
  }

  @Public()
  @Throttle({ checkout: { limit: 10, ttl: 60_000 } })
  @Patch('orders/ref/:paymentRef/transfer')
  markTransfer(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() dto: MarkTransferReferenceDto,
  ) {
    return this.ordersService.markTransferReference(
      paymentRef,
      dto.transferReference,
    );
  }

  @Get('stores/me/orders')
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

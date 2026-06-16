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
import { VendorStoreAccessService } from '../stores/vendor-store-access.service';
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

const ORDER_ACCESS_THROTTLE = {
  default: { limit: 10, ttl: 60_000 },
  'order-access-ip': { limit: 40, ttl: 60_000 },
} as const;

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly abandonedCartService: AbandonedCartService,
    private readonly vendorStoreAccess: VendorStoreAccessService,
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
  @Throttle({
    default: { limit: 5, ttl: 60_000 },
    'order-access-ip': { limit: 15, ttl: 60_000 },
  })
  @Post('orders/abandoned-cart')
  trackAbandonedCart(@Body() dto: AbandonedCartDto) {
    return this.abandonedCartService.track(dto);
  }

  @Public()
  @Throttle(ORDER_ACCESS_THROTTLE)
  @Post('orders/ref/:paymentRef/access')
  async getByPaymentRef(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() body: OrderRefQueryDto,
  ) {
    const order = await this.ordersService.getByPaymentRef(
      paymentRef,
      body.phone,
    );
    return { order };
  }

  @Public()
  @Throttle(ORDER_ACCESS_THROTTLE)
  @Post('orders/ref/:paymentRef/verify')
  async verifyPayment(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() body: OrderRefQueryDto,
  ) {
    const order = await this.ordersService.verifyPayment(
      paymentRef,
      body.phone,
    );
    return { order };
  }

  @Public()
  @Throttle(ORDER_ACCESS_THROTTLE)
  @Post('orders/ref/:paymentRef/receipt')
  getReceipt(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() body: OrderRefQueryDto,
  ) {
    return this.ordersService.getReceipt(paymentRef, body.phone);
  }

  @Public()
  @Throttle(ORDER_ACCESS_THROTTLE)
  @Patch('orders/ref/:paymentRef/transfer')
  markTransfer(
    @Param('paymentRef', PaymentRefPipe) paymentRef: string,
    @Body() dto: MarkTransferReferenceDto,
  ) {
    return this.ordersService.markTransferReference(
      paymentRef,
      dto.transferReference,
      dto.customerPhone,
    );
  }

  @Get('stores/me/orders')
  @RequireFeature('order-management')
  async listMine(
    @CurrentUser() user: User,
    @Query() query: SearchOrdersQueryDto,
  ) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.ordersService.listByStoreId(storeId, query.q);
  }

  @Get('stores/me/orders/unread-count')
  async unreadCount(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    const [count, payoutCount] = await Promise.all([
      this.ordersService.getUnreadCount(storeId),
      this.ordersService.getUnreadPayoutCount(storeId),
    ]);
    return { count, payoutCount };
  }

  @Patch('stores/me/orders/:orderId/status')
  @RequireFeature('order-management')
  async updateStatus(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.ordersService.updateStatus(
      storeId,
      orderId,
      dto.status,
      user.id,
    );
  }

  @Post('stores/me/orders/bulk-status')
  @RequireFeature('order-search')
  async bulkUpdateStatus(
    @CurrentUser() user: User,
    @Body() dto: BulkUpdateOrdersDto,
  ) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.ordersService.bulkUpdateStatus(
      storeId,
      dto.orderIds,
      dto.status,
      user.id,
    );
  }

  @Get('stores/me/orders/customer-count/:phone')
  async customerOrderCount(
    @CurrentUser() user: User,
    @Param('phone', CustomerPhoneParamPipe) phone: string,
  ) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.ordersService.getCustomerOrderCount(storeId, phone);
  }

  @Post('stores/me/orders/mark-seen')
  async markSeen(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    await this.ordersService.markAllSeen(storeId);
    return { success: true };
  }

  @Post('stores/me/payouts/mark-seen')
  async markPayoutsSeen(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    await this.ordersService.markAllPayoutsSeen(storeId);
    return { success: true };
  }
}

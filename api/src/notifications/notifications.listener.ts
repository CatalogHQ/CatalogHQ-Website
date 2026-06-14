import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { VENDOR_VERIFICATION_DECIDED_EVENT } from '../admin/events/admin.events';
import { VendorVerificationDecidedEvent } from '../admin/events/vendor-verification-decided.event';
import { ABANDONED_CART_EVENT } from '../orders/events/order.events';
import { AbandonedCartEvent } from '../orders/events/abandoned-cart.event';
import { ORDER_CREATED_EVENT } from '../orders/events/order.events';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { ORDER_STATUS_UPDATED_EVENT } from '../orders/events/order.events';
import { OrderStatusUpdatedEvent } from '../orders/events/order-status-updated.event';
import { REVIEW_INVITE_EVENT } from '../orders/events/order.events';
import { ReviewInviteEvent } from '../orders/events/review-invite.event';
import { LOW_STOCK_EVENT } from '../orders/events/order.events';
import { LowStockEvent } from '../orders/events/low-stock.event';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { TICKET_RESOLVED_EVENT } from '../tickets/events/ticket.events';
import { TicketResolvedEvent } from '../tickets/events/ticket-resolved.event';
import { PingramEmailService } from './pingram-email.service';
import { vendorNetFromOrderLine } from '../payments/flutterwave-fees.util';
import { SmsService } from './sms.service';

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Reserved',
  paid: 'Paid',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: PingramEmailService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly planEntitlementService: PlanEntitlementService,
  ) {}

  private get appOrigin(): string {
    const callbackBase = this.configService.get<string>(
      'FLUTTERWAVE_CALLBACK_BASE_URL',
    );
    if (callbackBase) {
      return callbackBase.replace(/\/$/, '');
    }

    const corsOrigin = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:3000',
    );
    return corsOrigin.split(',')[0]?.trim() || 'http://localhost:3000';
  }

  @OnEvent(ORDER_CREATED_EVENT)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: { store: { include: { vendor: true } } },
    });

    if (!order?.store) return;

    const { store } = order;
    const dashboardUrl = `${this.appOrigin}/dashboard/orders`;

    const vendorReceive = vendorNetFromOrderLine(order);

    if (store.whatsapp) {
      const message = `New CatalogHQ order ${order.paymentRef}: ${order.productName} x${order.quantity} (you receive ${vendorReceive} NGN) from ${order.customerName}. Check your dashboard.`;
      await this.smsService.sendSms(store.whatsapp, message);
    }

    const vendorEmail = store.vendor?.email;
    if (!vendorEmail) {
      this.logger.log(
        `Skipping order email for order ${order.id}: no vendor email on file.`,
      );
      return;
    }

    const storeName = store.businessName;
    const subject = `New order ${order.paymentRef} at ${storeName}`;
    const htmlBody = `<p>Hi,</p><p>You have a new paid order at <strong>${storeName}</strong>.</p><ul><li><strong>Reference:</strong> ${order.paymentRef}</li><li><strong>Customer:</strong> ${order.customerName}</li><li><strong>Product:</strong> ${order.productName} x${order.quantity}</li><li><strong>You receive:</strong> ${vendorReceive} NGN</li><li><strong>Customer paid:</strong> ${order.totalPaid} NGN</li></ul><p><a href="${dashboardUrl}">View orders in your dashboard</a></p><p>CatalogHQ Team</p>`;

    try {
      await this.emailService.sendEmail(
        vendorEmail,
        subject,
        htmlBody,
        storeName,
        { type: 'order_created' },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order notification email to ${vendorEmail}.`,
        error,
      );
    }
  }

  @OnEvent(ORDER_STATUS_UPDATED_EVENT)
  async handleOrderStatusUpdated(
    event: OrderStatusUpdatedEvent,
  ): Promise<void> {
    if (event.status === OrderStatus.paid) {
      return;
    }

    const label = STATUS_LABELS[event.status] ?? event.status;
    const message = `Your CatalogHQ order ${event.paymentRef} from ${event.storeName} is now ${label}. Track your order on CatalogHQ.`;
    await this.smsService.sendSms(event.customerPhone, message);
  }

  @OnEvent(REVIEW_INVITE_EVENT)
  async handleReviewInvite(event: ReviewInviteEvent): Promise<void> {
    const message = `How was your order ${event.paymentRef} from ${event.storeName}? Leave a review: ${this.appOrigin}/s/${event.storeSlug}/order/${event.paymentRef}/review`;
    await this.smsService.sendSms(event.customerPhone, message);
  }

  @OnEvent(LOW_STOCK_EVENT)
  async handleLowStock(event: LowStockEvent): Promise<void> {
    const message = `CatalogHQ alert: "${event.productName}" has only ${event.stock} left in stock. Restock soon.`;
    await this.smsService.sendSms(event.vendorPhone, message);
  }

  @OnEvent(ABANDONED_CART_EVENT)
  async handleAbandonedCart(event: AbandonedCartEvent): Promise<void> {
    const hasFeature = await this.planEntitlementService.hasFeature(
      event.storeId,
      'abandoned-cart',
    );
    if (!hasFeature) {
      return;
    }

    const store = await this.prisma.store.findUnique({
      where: { vendorId: event.storeId },
    });
    if (!store) return;

    const cart = await this.prisma.abandonedCart.findUnique({
      where: { id: event.cartId },
    });
    if (cart?.notifiedAt) return;

    const message = `You left items in your cart at ${store.businessName}. Complete your order: ${this.appOrigin}/s/${store.slug}`;
    await this.smsService.sendSms(event.customerPhone, message);

    await this.prisma.abandonedCart.update({
      where: { id: event.cartId },
      data: { notifiedAt: new Date() },
    });
  }

  @OnEvent(TICKET_RESOLVED_EVENT)
  async handleTicketResolved(event: TicketResolvedEvent): Promise<void> {
    const message = `Your CatalogHQ support ticket "${event.subject}" has been resolved. Reply on WhatsApp if you need more help.`;
    await this.smsService.sendSms(event.contactPhone, message);
  }

  @OnEvent(VENDOR_VERIFICATION_DECIDED_EVENT)
  async handleVendorVerificationDecided(
    event: VendorVerificationDecidedEvent,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.vendorId },
      include: { store: true },
    });

    if (!user?.email) {
      this.logger.log(
        `Skipping verification email for vendor ${event.vendorId}: no email on file.`,
      );
      return;
    }

    const storeName = user.store?.businessName ?? 'your store';

    if (event.approved) {
      try {
        await this.emailService.sendEmail(
          user.email,
          'Your CatalogHQ store is verified',
          `<p>Hi,</p><p>Great news! <strong>${storeName}</strong> has been verified on CatalogHQ. Your verified badge is now visible on your storefront.</p><p>CatalogHQ Team</p>`,
          storeName,
          { type: 'vendor_verification' },
        );
      } catch (error) {
        this.logger.error(
          `Failed to send verification approval email to ${user.email}.`,
          error,
        );
      }
      return;
    }

    const reason = event.reason ?? 'Verification requirements were not met.';
    try {
      await this.emailService.sendEmail(
        user.email,
        'CatalogHQ verification update',
        `<p>Hi,</p><p>We could not approve verification for <strong>${storeName}</strong>.</p><p><strong>Reason:</strong> ${reason}</p><p>You can resubmit updated documents from your dashboard settings.</p><p>CatalogHQ Team</p>`,
        storeName,
        { type: 'vendor_verification' },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification rejection email to ${user.email}.`,
        error,
      );
    }
  }
}

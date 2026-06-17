import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { getFlutterwaveWebhookRawBody } from '../payments/flutterwave-webhook-raw-body.util';
import { PaymentsService } from '../payments/payments.service';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import {
  buildPaystackWebhookDedupeKey,
  isPaystackAuthorizationActiveEvent,
  isPaystackChargeEvent,
  isPaystackSubscriptionLifecycleEvent,
  normalizePaystackChargeEvent,
  normalizePaystackSubscriptionEvent,
  PaystackWebhookEvent,
  verifyPaystackWebhookSignature,
} from './paystack-webhook.util';
import { VendorSubscriptionService } from './vendor-subscription.service';

@Controller('subscriptions')
export class PaystackSubscriptionWebhookController {
  private readonly logger = new Logger(PaystackSubscriptionWebhookController.name);

  constructor(
    private readonly vendorSubscriptionService: VendorSubscriptionService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  @Public()
  @Throttle({ webhook: { limit: 300, ttl: 60_000 } })
  @HttpCode(200)
  @Post('paystack/webhook')
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string | undefined,
    @Body() body: PaystackWebhookEvent,
  ) {
    const rawBody = getFlutterwaveWebhookRawBody(req);
    const secret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET');

    if (!secret?.trim()) {
      throw new UnauthorizedException('Paystack webhook secret is not configured.');
    }

    try {
      verifyPaystackWebhookSignature(rawBody, signature, secret);
    } catch (error) {
      await this.securityAudit.log({
        action: SecurityAuditAction.SUBSCRIPTION_WEBHOOK_SIGNATURE_INVALID,
        targetType: 'paystack_webhook',
        metadata: {
          event: body?.event,
        },
      });
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid webhook signature',
      );
    }

    const event = body?.event;
    if (!event) {
      throw new BadRequestException('Missing Paystack event type.');
    }

    const charge = isPaystackChargeEvent(event)
      ? normalizePaystackChargeEvent(body)
      : null;
    const dedupeKey = buildPaystackWebhookDedupeKey(
      event,
      charge?.reference,
      typeof body.data?.id === 'string' || typeof body.data?.id === 'number'
        ? String(body.data.id)
        : undefined,
    );

    const claimed = await this.paymentsService.claimWebhook(dedupeKey);
    if (!claimed) {
      return { received: true, note: 'Already processed' };
    }

    try {
      await this.processPaystackWebhook(body);
    } catch (error) {
      this.logger.error(
        `Paystack subscription webhook failed for ${dedupeKey}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      await this.paymentsService.releaseWebhook(dedupeKey);
      throw error;
    }

    return { received: true };
  }

  private async processPaystackWebhook(body: PaystackWebhookEvent): Promise<void> {
    const event = body.event;

    if (isPaystackChargeEvent(event)) {
      const charge = normalizePaystackChargeEvent(body);
      if (!charge) {
        return;
      }

      if (this.vendorSubscriptionService.isSubscriptionReference(charge.reference)) {
        if (charge.successful) {
          await this.vendorSubscriptionService.activateFromPayment(
            charge.reference,
            {
              amountKobo: charge.amountKobo,
              currency: charge.currency,
            },
          );
          await this.vendorSubscriptionService.attachPaystackBillingDetails(
            charge.reference,
            {
              customerCode: charge.customerCode,
              authorizationCode: charge.authorizationCode,
              subscriptionCode: charge.subscriptionCode,
            },
          );
        } else {
          await this.vendorSubscriptionService.markPaymentFailed(charge.reference);
        }
        return;
      }

      if (charge.successful && charge.subscriptionCode) {
        await this.vendorSubscriptionService.activateRenewalFromPaystack({
          subscriptionCode: charge.subscriptionCode,
          amountKobo: charge.amountKobo,
          currency: charge.currency,
          reference: charge.reference,
          customerCode: charge.customerCode,
          planCode: charge.planCode,
        });
      } else if (!charge.successful && charge.subscriptionCode) {
        await this.vendorSubscriptionService.markRenewalFailed({
          subscriptionCode: charge.subscriptionCode,
          reference: charge.reference,
        });
      }
      return;
    }

    if (isPaystackSubscriptionLifecycleEvent(event)) {
      const subscription = normalizePaystackSubscriptionEvent(body);
      if (!subscription) {
        return;
      }

      if (event === 'subscription.create') {
        await this.vendorSubscriptionService.syncPaystackSubscriptionRecord(
          subscription,
        );
        return;
      }

      if (
        event === 'subscription.disable' ||
        event === 'subscription.not_renew'
      ) {
        await this.vendorSubscriptionService.markPaystackSubscriptionCanceled(
          subscription.subscriptionCode,
        );
      }
      return;
    }

    if (isPaystackAuthorizationActiveEvent(event)) {
      const data = body.data as Record<string, unknown>;
      const authorizationCode =
        typeof data.authorization_code === 'string'
          ? data.authorization_code
          : undefined;
      const customerCode =
        typeof data.customer_code === 'string' ? data.customer_code : undefined;
      const reference =
        typeof data.reference === 'string' ? data.reference : undefined;

      if (reference && authorizationCode) {
        await this.vendorSubscriptionService.attachPaystackBillingDetails(
          reference,
          {
            customerCode,
            authorizationCode,
          },
        );
      }
    }
  }
}

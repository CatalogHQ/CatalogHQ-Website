import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, type Order } from '@prisma/client';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { normalizePhone } from '../common/phone.util';
import { verifyPhoneLastFour } from '../common/order-phone.util';
import { sanitizeUserText } from '../common/sanitize.util';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  OrderReviewStatusDto,
  ReviewDto,
  ReviewSummaryDto,
  toReviewDto,
} from './reviews.mapper';

const REVIEWABLE_STATUSES: OrderStatus[] = [
  OrderStatus.paid,
  OrderStatus.confirmed,
  OrderStatus.shipped,
  OrderStatus.delivered,
];

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesService: StoresService,
    private readonly planEntitlementService: PlanEntitlementService,
  ) {}

  private isOrderReviewable(order: Order): boolean {
    return (
      order.paymentStatus === PaymentStatus.paid &&
      REVIEWABLE_STATUSES.includes(order.status)
    );
  }

  async listByStoreSlug(slug: string): Promise<ReviewDto[]> {
    const store = await this.storesService.getPublicBySlug(slug);
    if (!store) return [];

    const hasReviews = await this.planEntitlementService.hasFeature(
      store.vendorId,
      'verified-reviews',
    );
    if (!hasReviews) return [];

    const reviews = await this.prisma.review.findMany({
      where: { storeId: store.vendorId },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map(toReviewDto);
  }

  async getSummaryByStoreSlug(slug: string): Promise<ReviewSummaryDto> {
    const reviews = await this.listByStoreSlug(slug);
    const verified = reviews.filter((review) => review.verified);
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      verifiedCount: verified.length,
    };
  }

  async getOrderReviewStatus(
    paymentRef: string,
    phoneLastFour: string,
  ): Promise<OrderReviewStatusDto> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef: { equals: paymentRef, mode: 'insensitive' } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    verifyPhoneLastFour(order.customerPhone, phoneLastFour);

    const hasReviews = await this.planEntitlementService.hasFeature(
      order.storeId,
      'verified-reviews',
    );
    if (!hasReviews) {
      return {
        canReview: false,
        alreadyReviewed: false,
      };
    }

    const existing = await this.prisma.review.findUnique({
      where: { orderId: order.id },
    });

    if (existing) {
      return {
        canReview: false,
        alreadyReviewed: true,
        review: toReviewDto(existing),
      };
    }

    return {
      canReview: this.isOrderReviewable(order),
      alreadyReviewed: false,
    };
  }

  async createForOrder(
    paymentRef: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef: { equals: paymentRef, mode: 'insensitive' } },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const hasReviews = await this.planEntitlementService.hasFeature(
      order.storeId,
      'verified-reviews',
    );
    if (!hasReviews) {
      throw new BadRequestException('Reviews are not enabled for this store.');
    }

    if (!this.isOrderReviewable(order)) {
      throw new BadRequestException(
        'You can only review paid orders that are being fulfilled or completed.',
      );
    }

    if (normalizePhone(dto.customerPhone) !== order.customerPhone) {
      throw new BadRequestException('Phone number does not match this order.');
    }

    const existing = await this.prisma.review.findUnique({
      where: { orderId: order.id },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this order.');
    }

    const review = await this.prisma.review.create({
      data: {
        storeId: order.storeId,
        buyerName: dto.buyerName.trim(),
        rating: dto.rating,
        comment: sanitizeUserText(dto.comment.trim()),
        productName: order.productName,
        verified: true,
        orderId: order.id,
      },
    });

    return toReviewDto(review);
  }

  async syncVerifiedReviewForDeliveredOrder(_orderId: string): Promise<void> {
    // Reviews are submitted by buyers after purchase; no auto-generated placeholders.
  }
}

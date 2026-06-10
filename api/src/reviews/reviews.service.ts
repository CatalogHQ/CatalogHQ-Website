import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ReviewDto,
  ReviewSummaryDto,
  toReviewDto,
} from './reviews.mapper';
import { normalizePhone } from '../common/phone.util';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesService: StoresService,
  ) {}

  async listByStoreSlug(slug: string): Promise<ReviewDto[]> {
    const store = await this.storesService.getPublicBySlug(slug);
    if (!store) return [];

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

  async createForOrder(
    paymentRef: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef: { equals: paymentRef, mode: 'insensitive' } },
      include: { store: { include: { vendor: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.delivered) {
      throw new BadRequestException('You can only review delivered orders.');
    }

    if (order.paymentStatus !== PaymentStatus.paid) {
      throw new BadRequestException('Order must be paid before reviewing.');
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
        comment: dto.comment.trim(),
        productName: order.productName,
        verified: true,
        orderId: order.id,
      },
    });

    return toReviewDto(review);
  }

  async syncVerifiedReviewForDeliveredOrder(_orderId: string): Promise<void> {
    // Reviews are submitted by buyers after delivery; no auto-generated placeholders.
  }
}

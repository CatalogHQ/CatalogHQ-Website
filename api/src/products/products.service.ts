import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { PlanEntitlementService } from '../plans/plan-entitlement.service';
import { StoresService } from '../stores/stores.service';
import { sanitizeUserHtml, sanitizeUserText } from '../common/sanitize.util';
import { ProductInputDto } from './dto/product-input.dto';
import { ProductDto, toProductDto } from './products.mapper';

const FALLBACK_PRODUCT_LIMITS: Record<PlanTier, number> = {
  starter: 15,
  pro: 30,
  growth: 50,
  business: 100,
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesService: StoresService,
    private readonly planCatalogService: PlanCatalogService,
    private readonly planEntitlementService: PlanEntitlementService,
  ) {}

  private normalizeInput(input: ProductInputDto) {
    const images = input.images ?? [];
    return {
      name: sanitizeUserText(input.name.trim()),
      description: sanitizeUserHtml((input.description ?? '').trim()),
      price: input.price,
      images,
      imageUrl: images[0] ?? null,
      colors: input.colors ?? [],
      productCategory: input.productCategory,
      sizingType: input.sizingType ?? 'none',
      sizes: input.sizes ?? [],
      deliveryOptions: input.deliveryOptions,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      published: input.published,
    };
  }

  private async assertProductLimit(storeId: string, planTier: PlanTier) {
    const count = await this.prisma.product.count({ where: { storeId } });
    let limit = FALLBACK_PRODUCT_LIMITS[planTier];
    try {
      limit = await this.planCatalogService.getProductLimit(planTier);
    } catch {
      // Keep fallback when catalog is unavailable.
    }
    if (count >= limit) {
      throw new ForbiddenException(
        `Your plan allows up to ${limit} products. Upgrade to add more.`,
      );
    }
  }

  async listByStoreId(storeId: string): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(toProductDto);
  }

  async listPublishedByStoreId(storeId: string): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: { storeId, published: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(toProductDto);
  }

  async listPublicBySlug(slug: string): Promise<{ products: ProductDto[] }> {
    const store = await this.storesService.getPublicBySlug(slug);
    if (!store) {
      return { products: [] };
    }

    const products = await this.listPublishedByStoreId(store.vendorId);
    const hideSoldOut = await this.planEntitlementService.hasFeature(
      store.vendorId,
      'advanced-inventory-tracking',
    );

    const filtered = hideSoldOut
      ? products.filter((product) => product.stock > 0)
      : products;

    return { products: filtered };
  }

  async getPublicBySlugAndId(
    slug: string,
    productId: string,
  ): Promise<ProductDto> {
    const store = await this.storesService.getPublicBySlug(slug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return this.getPublishedById(store.vendorId, productId);
  }

  async getById(storeId: string, productId: string): Promise<ProductDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return toProductDto(product);
  }

  async getPublishedById(
    storeId: string,
    productId: string,
  ): Promise<ProductDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId, published: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return toProductDto(product);
  }

  async create(storeId: string, input: ProductInputDto): Promise<ProductDto> {
    await this.planEntitlementService.assertActiveSubscription(storeId);
    const effectiveTier = await this.planEntitlementService.getEffectiveTier(storeId);
    if (!effectiveTier) {
      throw new ForbiddenException('Subscribe to a plan to add products.');
    }
    await this.assertProductLimit(storeId, effectiveTier);
    const product = await this.prisma.product.create({
      data: {
        storeId,
        ...this.normalizeInput(input),
      },
    });
    return toProductDto(product);
  }

  async update(
    storeId: string,
    productId: string,
    input: ProductInputDto,
  ): Promise<ProductDto> {
    await this.getById(storeId, productId);
    const product = await this.prisma.product.update({
      where: { id: productId, storeId },
      data: this.normalizeInput(input),
    });
    return toProductDto(product);
  }

  async remove(storeId: string, productId: string): Promise<void> {
    await this.getById(storeId, productId);
    await this.prisma.product.delete({ where: { id: productId, storeId } });
  }

  countByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }
}

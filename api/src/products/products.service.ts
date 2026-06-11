import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { ProductInputDto } from './dto/product-input.dto';
import { ProductDto, toProductDto } from './products.mapper';

const PRODUCT_LIMITS: Record<PlanTier, number> = {
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
  ) {}

  private normalizeInput(input: ProductInputDto) {
    const images = input.images ?? [];
    return {
      name: input.name.trim(),
      description: (input.description ?? '').trim(),
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
    const limit = PRODUCT_LIMITS[planTier];
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
    return { products };
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

  async create(
    storeId: string,
    planTier: PlanTier,
    input: ProductInputDto,
  ): Promise<ProductDto> {
    await this.assertProductLimit(storeId, planTier);
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
      where: { id: productId },
      data: this.normalizeInput(input),
    });
    return toProductDto(product);
  }

  async remove(storeId: string, productId: string): Promise<void> {
    await this.getById(storeId, productId);
    await this.prisma.product.delete({ where: { id: productId } });
  }

  countByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }
}

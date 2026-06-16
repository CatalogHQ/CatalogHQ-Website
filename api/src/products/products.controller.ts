import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { VendorStoreAccessService } from '../stores/vendor-store-access.service';
import { ProductInputDto } from './dto/product-input.dto';
import { ProductsService } from './products.service';

@Controller('stores')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly vendorStoreAccess: VendorStoreAccessService,
  ) {}

  @Get('me/products')
  async listMine(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.productsService.listByStoreId(storeId);
  }

  @Get('me/products/:productId')
  async getMine(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.productsService.getById(storeId, productId);
  }

  @Post('me/products')
  async create(@CurrentUser() user: User, @Body() dto: ProductInputDto) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.productsService.create(storeId, dto);
  }

  @Put('me/products/:productId')
  async update(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: ProductInputDto,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.productsService.update(storeId, productId, dto);
  }

  @Delete('me/products/:productId')
  async remove(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    await this.productsService.remove(storeId, productId);
    return { success: true };
  }

  @Public()
  @Get('public/:slug/products')
  listPublic(@Param('slug') slug: string) {
    return this.productsService.listPublicBySlug(slug);
  }

  @Public()
  @Get('public/:slug/products/:productId')
  getPublic(
    @Param('slug') slug: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.getPublicBySlugAndId(slug, productId);
  }
}

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
import { ProductInputDto } from './dto/product-input.dto';
import { ProductsService } from './products.service';

@Controller('stores')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('me/products')
  listMine(@CurrentUser() user: User) {
    return this.productsService.listByStoreId(user.id);
  }

  @Get('me/products/:productId')
  getMine(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.getById(user.id, productId);
  }

  @Post('me/products')
  create(@CurrentUser() user: User, @Body() dto: ProductInputDto) {
    return this.productsService.create(user.id, user.planTier, dto);
  }

  @Put('me/products/:productId')
  update(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: ProductInputDto,
  ) {
    return this.productsService.update(user.id, productId, dto);
  }

  @Delete('me/products/:productId')
  async remove(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    await this.productsService.remove(user.id, productId);
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

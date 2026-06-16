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
import { RequireFeature, SkipSubscriptionGuard } from '../common/decorators/plan-access.decorator';
import { ValidateBodyArrayPipe } from '../common/pipes/validate-body-array.pipe';
import { PaymentsService } from '../payments/payments.service';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { DeliveryZoneDto } from './dto/delivery-zone.dto';
import { QuickReplyDto } from './dto/quick-reply.dto';
import { StoreSetupDto } from './dto/store-setup.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { UpsertStockLocationDto } from './dto/upsert-stock-location.dto';
import { StoreStaffService } from './store-staff.service';
import { StoresService } from './stores.service';
import { VendorPayoutService } from './vendor-payout.service';
import { VendorStoreAccessService } from './vendor-store-access.service';
import { VendorToolsService } from './vendor-tools.service';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly vendorToolsService: VendorToolsService,
    private readonly storeStaffService: StoreStaffService,
    private readonly paymentsService: PaymentsService,
    private readonly vendorPayoutService: VendorPayoutService,
    private readonly vendorStoreAccess: VendorStoreAccessService,
  ) {}

  @Get('me')
  @SkipSubscriptionGuard()
  async getMyStore(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.requireStore(user.id);
    const store = await this.storesService.getByVendorId(storeId);
    return { store };
  }

  @Put('me')
  async saveDraft(@CurrentUser() user: User, @Body() dto: StoreSetupDto) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.storesService.saveDraft(storeId, dto);
  }

  @Post('me/complete-setup')
  async completeSetup(@CurrentUser() user: User, @Body() dto: StoreSetupDto) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.storesService.completeSetup(storeId, dto);
  }

  @Get('me/slug/:slug/available')
  @SkipSubscriptionGuard()
  async isMySlugAvailable(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ) {
    const taken = await this.storesService.isSlugTaken(slug, user.id);
    return { available: !taken };
  }

  @Public()
  @Get('public/:slug')
  async getPublicStore(@Param('slug') slug: string) {
    const store = await this.storesService.getPublicBySlug(slug);
    return { store };
  }

  @Get('me/quick-replies')
  async getQuickReplies(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.getQuickReplies(storeId);
  }

  @Put('me/quick-replies')
  @RequireFeature('quick-reply-templates')
  async saveQuickReplies(
    @CurrentUser() user: User,
    @Body(ValidateBodyArrayPipe(QuickReplyDto))
    templates: QuickReplyDto[],
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.saveQuickReplies(storeId, templates);
  }

  @Get('me/delivery-zones')
  async getDeliveryZones(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.getDeliveryZones(storeId);
  }

  @Put('me/delivery-zones')
  @RequireFeature('delivery-zones')
  async saveDeliveryZones(
    @CurrentUser() user: User,
    @Body(ValidateBodyArrayPipe(DeliveryZoneDto))
    zones: DeliveryZoneDto[],
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.saveDeliveryZones(storeId, zones);
  }

  @Get('me/discount-codes')
  @RequireFeature('discount-codes')
  async listDiscountCodes(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.listDiscountCodes(storeId);
  }

  @Post('me/discount-codes')
  @RequireFeature('discount-codes')
  async createDiscountCode(
    @CurrentUser() user: User,
    @Body() dto: CreateDiscountCodeDto,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.createDiscountCode(storeId, dto);
  }

  @Delete('me/discount-codes/:id')
  @RequireFeature('discount-codes')
  async deleteDiscountCode(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.deleteDiscountCode(storeId, id);
  }

  @Get('me/analytics/advanced')
  @RequireFeature('advanced-analytics')
  async advancedAnalytics(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.getAnalytics(storeId);
  }

  @Get('me/team')
  @RequireFeature('staff-roles')
  listTeam(@CurrentUser() user: User) {
    return this.storeStaffService.listMembers(user.id);
  }

  @Post('me/team')
  @RequireFeature('staff-roles')
  addTeamMember(
    @CurrentUser() user: User,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.storeStaffService.addMember(user.id, dto.email, dto.role);
  }

  @Delete('me/team/:memberId')
  @RequireFeature('staff-roles')
  removeTeamMember(
    @CurrentUser() user: User,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.storeStaffService.removeMember(user.id, memberId);
  }

  @Get('me/activity')
  @RequireFeature('staff-roles')
  listActivity(@CurrentUser() user: User) {
    return this.storeStaffService.listActivity(user.id);
  }

  @Get('me/payout/banks')
  listPayoutBanks() {
    return this.vendorPayoutService.listBanks();
  }

  @Get('me/payout')
  async getPayoutAccount(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorPayoutService.getPayoutAccount(storeId);
  }

  @Post('me/payout/resolve')
  async resolvePayoutAccount(
    @CurrentUser() user: User,
    @Body() dto: UpdatePayoutDto,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorPayoutService.resolvePayoutAccount(storeId, dto);
  }

  @Put('me/payout')
  async updatePayoutAccount(
    @CurrentUser() user: User,
    @Body() dto: UpdatePayoutDto,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorPayoutService.updatePayoutAccount(storeId, dto, user.id);
  }

  @Get('me/payouts')
  async listPayoutHistory(@CurrentUser() user: User) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorPayoutService.listPayoutHistory(storeId);
  }

  @Post('me/orders/:orderId/payment-link')
  @RequireFeature('payment-links')
  async getPaymentLink(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const storeId = await this.vendorStoreAccess.resolveStoreId(user.id, [
      'owner',
      'fulfiller',
    ]);
    return this.paymentsService.getPaymentLinkResponse(orderId, storeId);
  }

  @Get('me/products/:productId/stock-locations')
  @RequireFeature('multi-location-stock')
  async listStockLocations(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.listStockLocations(storeId, productId);
  }

  @Put('me/products/:productId/stock-locations')
  @RequireFeature('multi-location-stock')
  async upsertStockLocation(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpsertStockLocationDto,
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(user.id);
    return this.vendorToolsService.upsertStockLocation(
      storeId,
      productId,
      dto.locationName,
      dto.stock,
    );
  }
}

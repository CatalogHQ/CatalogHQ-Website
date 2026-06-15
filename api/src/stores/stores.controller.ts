import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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
import { VendorToolsService } from './vendor-tools.service';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly vendorToolsService: VendorToolsService,
    private readonly storeStaffService: StoreStaffService,
    private readonly paymentsService: PaymentsService,
    private readonly vendorPayoutService: VendorPayoutService,
  ) {}

  @Get('me')
  @SkipSubscriptionGuard()
  async getMyStore(@CurrentUser() user: User) {
    const store = await this.storesService.getByVendorId(user.id);
    return { store };
  }

  @Put('me')
  saveDraft(@CurrentUser() user: User, @Body() dto: StoreSetupDto) {
    return this.storesService.saveDraft(user.id, dto);
  }

  @Post('me/complete-setup')
  completeSetup(@CurrentUser() user: User, @Body() dto: StoreSetupDto) {
    return this.storesService.completeSetup(user.id, dto);
  }

  @Public()
  @Get('slug/:slug/available')
  async isSlugAvailable(
    @Param('slug') slug: string,
    @Query('excludeVendorId') excludeVendorId?: string,
  ) {
    const taken = await this.storesService.isSlugTaken(slug, excludeVendorId);
    return { available: !taken };
  }

  @Public()
  @Get('public/:slug')
  async getPublicStore(@Param('slug') slug: string) {
    const store = await this.storesService.getPublicBySlug(slug);
    return { store };
  }

  @Get('me/quick-replies')
  getQuickReplies(@CurrentUser() user: User) {
    return this.vendorToolsService.getQuickReplies(user.id);
  }

  @Put('me/quick-replies')
  @RequireFeature('quick-reply-templates')
  saveQuickReplies(
    @CurrentUser() user: User,
    @Body(ValidateBodyArrayPipe(QuickReplyDto))
    templates: QuickReplyDto[],
  ) {
    return this.vendorToolsService.saveQuickReplies(user.id, templates);
  }

  @Get('me/delivery-zones')
  getDeliveryZones(@CurrentUser() user: User) {
    return this.vendorToolsService.getDeliveryZones(user.id);
  }

  @Put('me/delivery-zones')
  @RequireFeature('delivery-zones')
  saveDeliveryZones(
    @CurrentUser() user: User,
    @Body(ValidateBodyArrayPipe(DeliveryZoneDto))
    zones: DeliveryZoneDto[],
  ) {
    return this.vendorToolsService.saveDeliveryZones(user.id, zones);
  }

  @Get('me/discount-codes')
  @RequireFeature('discount-codes')
  listDiscountCodes(@CurrentUser() user: User) {
    return this.vendorToolsService.listDiscountCodes(user.id);
  }

  @Post('me/discount-codes')
  @RequireFeature('discount-codes')
  createDiscountCode(
    @CurrentUser() user: User,
    @Body() dto: CreateDiscountCodeDto,
  ) {
    return this.vendorToolsService.createDiscountCode(user.id, dto);
  }

  @Delete('me/discount-codes/:id')
  @RequireFeature('discount-codes')
  deleteDiscountCode(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorToolsService.deleteDiscountCode(user.id, id);
  }

  @Get('me/analytics/advanced')
  @RequireFeature('advanced-analytics')
  advancedAnalytics(@CurrentUser() user: User) {
    return this.vendorToolsService.getAnalytics(user.id);
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
  getPayoutAccount(@CurrentUser() user: User) {
    return this.vendorPayoutService.getPayoutAccount(user.id);
  }

  @Post('me/payout/resolve')
  resolvePayoutAccount(
    @CurrentUser() user: User,
    @Body() dto: UpdatePayoutDto,
  ) {
    return this.vendorPayoutService.resolvePayoutAccount(user.id, dto);
  }

  @Put('me/payout')
  updatePayoutAccount(
    @CurrentUser() user: User,
    @Body() dto: UpdatePayoutDto,
  ) {
    return this.vendorPayoutService.updatePayoutAccount(user.id, dto);
  }

  @Get('me/payouts')
  listPayoutHistory(@CurrentUser() user: User) {
    return this.vendorPayoutService.listPayoutHistory(user.id);
  }

  @Post('me/orders/:orderId/payment-link')
  @RequireFeature('payment-links')
  getPaymentLink(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.paymentsService.getPaymentLinkResponse(orderId, user.id);
  }

  @Get('me/products/:productId/stock-locations')
  @RequireFeature('multi-location-stock')
  listStockLocations(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.vendorToolsService.listStockLocations(user.id, productId);
  }

  @Put('me/products/:productId/stock-locations')
  @RequireFeature('multi-location-stock')
  upsertStockLocation(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpsertStockLocationDto,
  ) {
    return this.vendorToolsService.upsertStockLocation(
      user.id,
      productId,
      dto.locationName,
      dto.stock,
    );
  }
}

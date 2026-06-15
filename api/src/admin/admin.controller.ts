import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PlanTier, User } from '@prisma/client';
import { AdminGuard } from '../common/guards/admin.guard';
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminTotpGuard } from './admin-totp.guard';
import { AdminTotpOptional } from './decorators/admin-totp-optional.decorator';
import { EnableTotpDto } from './dto/enable-totp.dto';
import { AdminService } from './admin.service';
import {
  RevenueAnalyticsQueryDto,
  TopVendorsQueryDto,
} from './dto/analytics-query.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { UpdateTicketDto } from '../tickets/dto/update-ticket.dto';
import { TicketsService } from '../tickets/tickets.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AdminUpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePlanCatalogDto } from './dto/update-plan-catalog.dto';

function parsePlanTier(tier: string): PlanTier {
  if (!Object.values(PlanTier).includes(tier as PlanTier)) {
    throw new BadRequestException('Invalid plan tier.');
  }
  return tier as PlanTier;
}

@Controller('admin')
@UseGuards(AdminGuard, AdminTotpGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ticketsService: TicketsService,
    private readonly planCatalogService: PlanCatalogService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Post('totp/setup')
  @AdminTotpOptional()
  setupTotp(@CurrentUser() user: User) {
    return this.adminAuthService.setupTotp(user.id);
  }

  @Post('totp/enable')
  @AdminTotpOptional()
  async enableTotp(
    @CurrentUser() user: User,
    @Body() dto: EnableTotpDto,
  ) {
    await this.adminAuthService.enableTotp(user.id, dto.token);
    return { success: true };
  }

  @Get('badges')
  getBadges() {
    return this.adminService.getBadges();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('vendors')
  listVendors() {
    return this.adminService.listVendors();
  }

  @Get('customers')
  listCustomers() {
    return this.adminService.listCustomers();
  }

  @Get('orders')
  listOrders() {
    return this.adminService.listOrders();
  }

  @Get('tickets')
  listTickets() {
    return this.adminService.listTickets();
  }

  @Patch('tickets/:id')
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    await this.ticketsService.updateByAdmin(id, dto);
    return this.adminService.getTicket(id);
  }

  @Get('verification')
  listVerificationQueue() {
    return this.adminService.listVerificationQueue();
  }

  @Post('verification/:vendorId/approve')
  async approveVerification(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ) {
    await this.adminService.approveVerification(vendorId);
    return { success: true };
  }

  @Post('verification/:vendorId/reject')
  async rejectVerification(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: RejectVerificationDto,
  ) {
    await this.adminService.rejectVerification(vendorId, dto.reason);
    return { success: true };
  }

  @Get('analytics/revenue')
  getRevenueAnalytics(@Query() query: RevenueAnalyticsQueryDto) {
    return this.adminService.getRevenueAnalytics(query.preset);
  }

  @Get('analytics/top-vendors')
  getTopVendors(@Query() query: TopVendorsQueryDto) {
    return this.adminService.getTopVendors(query.limit);
  }

  @Get('analytics/plans')
  getPlanDistribution() {
    return this.adminService.getPlanDistribution();
  }

  @Patch('vendors/:vendorId')
  updateVendor(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.adminService.updateVendorPlan(vendorId, dto.planTier);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: AdminUpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(orderId, dto.status);
  }

  @Post('orders/:orderId/confirm-payment')
  confirmOrderPayment(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.adminService.confirmOrderPayment(orderId);
  }

  @Get('plans')
  listPlans() {
    return this.planCatalogService.listAdminCatalog();
  }

  @Patch('plans/:tier')
  updatePlan(
    @Param('tier') tier: string,
    @Body() dto: UpdatePlanCatalogDto,
  ) {
    return this.planCatalogService.updatePlan(parsePlanTier(tier), dto);
  }

  @Post('plans/:tier/reset-defaults')
  resetPlanDefaults(@Param('tier') tier: string) {
    return this.planCatalogService.resetPlanDefaults(parsePlanTier(tier));
  }
}

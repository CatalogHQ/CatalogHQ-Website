import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PlanTier, User } from '@prisma/client';
import type { Request } from 'express';
import { getClientIp } from '../common/client-ip.util';
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
import { AdminDateRangeQueryDto } from './dto/admin-date-range-query.dto';
import { parseAdminDateRange } from './admin-date-range.util';
import { UpdatePlanCatalogDto } from './dto/update-plan-catalog.dto';
import { ListSecurityAuditQueryDto } from '../security/dto/list-security-audit-query.dto';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import type { SecurityAuditActionId } from '../security/security-audit.actions';
import { AuthenticatedUser } from '../auth/authenticated-user.type';

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
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  private async auditAdminRead(
    user: AuthenticatedUser,
    req: Request,
    action: SecurityAuditActionId,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.securityAuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action,
      ipAddress: getClientIp(req),
      metadata,
    });
  }

  @Post('totp/setup')
  @AdminTotpOptional()
  setupTotp(@CurrentUser() user: User) {
    return this.adminAuthService.setupTotp(user.id);
  }

  @Post('totp/enable')
  @AdminTotpOptional()
  async enableTotp(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Body() dto: EnableTotpDto,
  ) {
    await this.adminAuthService.enableTotp(user.id, dto.token);
    await this.adminService.logAdminTotpEnabled(user, getClientIp(req));
    return { success: true };
  }

  @Get('badges')
  getBadges() {
    return this.adminService.getBadges();
  }

  @Get('security-logs')
  async listSecurityLogs(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Query() query: ListSecurityAuditQueryDto,
  ) {
    await this.securityAuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.ADMIN_VIEW_SECURITY_LOGS,
      metadata: {
        category: query.category,
        search: query.search ?? null,
        limit: query.limit,
        offset: query.offset,
      },
      ipAddress: getClientIp(req),
    });

    return this.securityAuditService.list(query);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('vendors')
  async listVendors(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Query() query: AdminDateRangeQueryDto,
  ) {
    await this.auditAdminRead(user, req, SecurityAuditAction.ADMIN_VIEW_VENDORS, {
      from: query.from ?? null,
      to: query.to ?? null,
    });
    return this.adminService.listVendors(parseAdminDateRange(query));
  }

  @Get('customers')
  async listCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Query() query: AdminDateRangeQueryDto,
  ) {
    await this.auditAdminRead(user, req, SecurityAuditAction.ADMIN_VIEW_CUSTOMERS, {
      from: query.from ?? null,
      to: query.to ?? null,
    });
    return this.adminService.listCustomers(parseAdminDateRange(query));
  }

  @Get('orders')
  async listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Query() query: AdminDateRangeQueryDto,
  ) {
    await this.auditAdminRead(user, req, SecurityAuditAction.ADMIN_VIEW_ORDERS, {
      from: query.from ?? null,
      to: query.to ?? null,
    });
    return this.adminService.listOrders(parseAdminDateRange(query));
  }

  @Get('payouts')
  async listPayouts(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Query() query: AdminDateRangeQueryDto,
  ) {
    await this.auditAdminRead(user, req, SecurityAuditAction.ADMIN_VIEW_PAYOUTS, {
      from: query.from ?? null,
      to: query.to ?? null,
    });
    return this.adminService.listPayouts(parseAdminDateRange(query));
  }

  @Get('tickets')
  listTickets() {
    return this.adminService.listTickets();
  }

  @Patch('tickets/:id')
  async updateTicket(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    await this.ticketsService.updateByAdmin(id, dto);
    await this.securityAuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.ADMIN_UPDATE_TICKET,
      targetType: 'ticket',
      targetId: id,
      metadata: {
        status: dto.status ?? null,
        priority: dto.priority ?? null,
      },
      ipAddress: getClientIp(req),
    });
    return this.adminService.getTicket(id);
  }

  @Get('verification')
  async listVerificationQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    await this.auditAdminRead(
      user,
      req,
      SecurityAuditAction.ADMIN_VIEW_VERIFICATION_QUEUE,
    );
    return this.adminService.listVerificationQueue();
  }

  @Post('verification/:vendorId/approve')
  async approveVerification(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ) {
    await this.adminService.approveVerification(
      vendorId,
      user,
      getClientIp(req),
    );
    return { success: true };
  }

  @Post('verification/:vendorId/reject')
  async rejectVerification(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: RejectVerificationDto,
  ) {
    await this.adminService.rejectVerification(
      vendorId,
      dto.reason,
      user,
      getClientIp(req),
    );
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
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.adminService.updateVendorPlan(
      vendorId,
      dto.planTier,
      user,
      getClientIp(req),
    );
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: AdminUpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(
      orderId,
      dto.status,
      user,
      getClientIp(req),
    );
  }

  @Post('orders/:orderId/confirm-payment')
  confirmOrderPayment(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.adminService.confirmOrderPayment(
      orderId,
      user,
      getClientIp(req),
    );
  }

  @Get('plans')
  listPlans() {
    return this.planCatalogService.listAdminCatalog();
  }

  @Patch('plans/:tier')
  async updatePlan(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('tier') tier: string,
    @Body() dto: UpdatePlanCatalogDto,
  ) {
    const parsedTier = parsePlanTier(tier);
    const updated = await this.planCatalogService.updatePlan(parsedTier, dto);
    await this.securityAuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.ADMIN_UPDATE_PLAN_CATALOG,
      targetType: 'plan',
      targetId: parsedTier,
      metadata: { fields: Object.keys(dto) },
      ipAddress: getClientIp(req),
    });
    return updated;
  }

  @Post('plans/:tier/reset-defaults')
  async resetPlanDefaults(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Param('tier') tier: string,
  ) {
    const parsedTier = parsePlanTier(tier);
    const updated =
      await this.planCatalogService.resetPlanDefaults(parsedTier);
    await this.securityAuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.ADMIN_RESET_PLAN_DEFAULTS,
      targetType: 'plan',
      targetId: parsedTier,
      ipAddress: getClientIp(req),
    });
    return updated;
  }
}

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
} from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';
import {
  RevenueAnalyticsQueryDto,
  TopVendorsQueryDto,
} from './dto/analytics-query.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { UpdateTicketDto } from '../tickets/dto/update-ticket.dto';
import { TicketsService } from '../tickets/tickets.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ticketsService: TicketsService,
  ) {}

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
  updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateByAdmin(id, dto);
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
}

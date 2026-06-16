import {
  Controller,
  Get,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import type { Request } from 'express';
import { AdminTotpGuard } from '../admin/admin-totp.guard';
import { getClientIp } from '../common/client-ip.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import { HealthDetailService } from './health-detail.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthDetail: HealthDetailService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  liveness() {
    return this.health.check([]);
  }

  @Get('ready')
  @Public()
  async readiness() {
    const detail = await this.healthDetail.getDetail();

    if (detail.status !== 'ok') {
      throw new ServiceUnavailableException({ status: 'degraded' });
    }

    return { status: 'ok' };
  }

  @Get('detail')
  @UseGuards(AdminGuard, AdminTotpGuard)
  async detail(@CurrentUser() user: User, @Req() req: Request) {
    await this.securityAudit.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.ADMIN_VIEW_HEALTH,
      ipAddress: getClientIp(req),
    });

    return this.healthDetail.getDetail();
  }
}

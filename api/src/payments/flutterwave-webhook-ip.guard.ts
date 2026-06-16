import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getClientIp } from '../common/client-ip.util';
import { isProductionEnv } from '../common/env.util';

@Injectable()
export class FlutterwaveWebhookIpGuard implements CanActivate {
  private readonly logger = new Logger(FlutterwaveWebhookIpGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const allowlist = this.parseAllowlist(
      this.configService.get<string>('FLUTTERWAVE_WEBHOOK_ALLOWED_IPS'),
    );

    if (allowlist.length === 0) {
      if (isProductionEnv(this.configService)) {
        throw new ForbiddenException('Webhook IP allowlist is not configured.');
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = getClientIp(request);

    if (!allowlist.includes(clientIp)) {
      this.logger.warn(
        `Rejected Flutterwave webhook from non-allowlisted IP: ${clientIp}`,
      );
      throw new ForbiddenException('Webhook source is not allowed.');
    }

    return true;
  }

  private parseAllowlist(raw: string | undefined): string[] {
    if (!raw?.trim()) {
      return [];
    }

    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}

// .
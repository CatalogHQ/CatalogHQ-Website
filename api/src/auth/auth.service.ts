import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { AdminAuthService } from '../admin/admin-auth.service';
import { normalizeEmail } from '../common/email.util';
import { PrismaService } from '../prisma/prisma.service';
import { VendorSubscriptionService } from '../subscriptions/vendor-subscription.service';
import { SignInDto } from './dto/sign-in.dto';
import { SafeUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly vendorSubscriptionService: VendorSubscriptionService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  async toSafeUser(user: User): Promise<SafeUser> {
    const base: SafeUser = {
      id: user.id,
      email: user.email,
      phone: user.phone ?? undefined,
      planTier: user.planTier,
      role: user.role,
      subscriptionExempt: user.subscriptionExempt,
      createdAt: user.createdAt.toISOString(),
      totpEnabled: user.totpEnabled,
    };

    if (user.role !== 'vendor') {
      return base;
    }

    try {
      const subscription = await this.vendorSubscriptionService.getSubscription(
        user.id,
      );
      return {
        ...base,
        subscription: {
          status: subscription.status,
          planTier: subscription.planTier,
          paidPlanTier: subscription.paidPlanTier,
          currentPeriodEnd: subscription.currentPeriodEnd,
          graceEndsAt: subscription.graceEndsAt,
          isHardBlocked: subscription.isHardBlocked,
          hasActiveAccess: subscription.hasActiveAccess,
        },
      };
    } catch {
      return base;
    }
  }

  createSession(user: User): Promise<{ user: SafeUser; token: string }> {
    const token = this.jwtService.sign({
      sub: user.id,
      sv: user.sessionVersion,
    });
    return this.toSafeUser(user).then((safeUser) => ({
      user: safeUser,
      token,
    }));
  }

  async signIn(dto: SignInDto): Promise<{ user: SafeUser; token: string }> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (this.adminAuthService.requiresTotp(user)) {
      if (!dto.totpCode) {
        throw new UnauthorizedException('Admin accounts require a 2FA code');
      }
      const totpValid = await this.adminAuthService.verifyTotp(
        user.id,
        dto.totpCode,
      );
      if (!totpValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    return this.createSession(user);
  }

  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toSafeUser(user) : null;
  }
}

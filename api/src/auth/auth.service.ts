import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AdminAuthService } from '../admin/admin-auth.service';
import { normalizeEmail } from '../common/email.util';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import { VendorSubscriptionService } from '../subscriptions/vendor-subscription.service';
import {
  createRefreshTokenValue,
  getRefreshTokenExpiresAt,
  hashRefreshTokenValue,
} from './refresh-token-cookie.util';
import { SignInDto } from './dto/sign-in.dto';
import { SafeUser } from './auth.types';

export type AuthSessionResult = {
  user: SafeUser;
  token: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly vendorSubscriptionService: VendorSubscriptionService,
    private readonly adminAuthService: AdminAuthService,
    private readonly securityAudit: SecurityAuditService,
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

  private getAccessTokenExpiresIn(role: UserRole): string {
    if (role === UserRole.admin) {
      return this.configService.get<string>('JWT_ADMIN_EXPIRES_IN') ?? '30m';
    }

    return this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
  }

  private signAccessToken(user: User): string {
    const expiresIn = this.getAccessTokenExpiresIn(
      user.role,
    ) as JwtSignOptions['expiresIn'];

    const payload: {
      sub: string;
      sv: number;
      aso?: 1;
    } = {
      sub: user.id,
      sv: user.sessionVersion,
    };

    if (user.role === UserRole.admin && !user.totpEnabled) {
      payload.aso = 1;
    }

    return this.jwtService.sign(payload, { expiresIn });
  }

  private async persistRefreshToken(
    userId: string,
    familyId?: string,
  ): Promise<string> {
    const refreshToken = createRefreshTokenValue();
    const tokenHash = hashRefreshTokenValue(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: familyId ?? randomUUID(),
        expiresAt: getRefreshTokenExpiresAt(this.configService),
      },
    });

    return refreshToken;
  }

  async createSession(
    user: User,
    refreshFamilyId?: string,
  ): Promise<AuthSessionResult> {
    const token = this.signAccessToken(user);
    const refreshToken = await this.persistRefreshToken(
      user.id,
      refreshFamilyId,
    );
    const safeUser = await this.toSafeUser(user);

    return {
      user: safeUser,
      token,
      refreshToken,
    };
  }

  private async handleRefreshTokenReuse(
    familyId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { familyId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.securityAudit.log({
      actorId: userId,
      actorEmail: user?.email,
      action: SecurityAuditAction.AUTH_REFRESH_REUSE,
      ipAddress,
      metadata: { familyId },
    });
  }

  async refreshSession(
    rawRefreshToken: string | undefined,
    ipAddress?: string,
  ): Promise<AuthSessionResult> {
    const token = rawRefreshToken?.trim();
    if (!token) {
      await this.securityAudit.log({
        action: SecurityAuditAction.AUTH_REFRESH_FAILED,
        ipAddress,
        metadata: { reason: 'missing_token' },
      });
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const tokenHash = hashRefreshTokenValue(token);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (stored?.replacedAt) {
      await this.handleRefreshTokenReuse(stored.familyId, stored.userId, ipAddress);
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    if (!stored || stored.expiresAt <= new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      await this.securityAudit.log({
        action: SecurityAuditAction.AUTH_REFRESH_FAILED,
        ipAddress,
        metadata: { reason: 'invalid_or_expired' },
      });
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedAt: new Date() },
    });

    const user = stored.user;
    const session = await this.createSession(user, stored.familyId);

    await this.securityAudit.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.AUTH_REFRESH,
      ipAddress,
    });

    return session;
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async signIn(
    dto: SignInDto,
    ipAddress?: string,
  ): Promise<AuthSessionResult> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      await this.securityAudit.log({
        action: SecurityAuditAction.AUTH_SIGNIN_FAILED,
        ipAddress,
        metadata: { reason: 'invalid_credentials' },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.securityAudit.log({
        action: SecurityAuditAction.AUTH_SIGNIN_FAILED,
        actorId: user.id,
        ipAddress,
        metadata: { reason: 'invalid_credentials' },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (
      user.role === UserRole.admin &&
      user.totpSecret &&
      !user.totpEnabled
    ) {
      await this.securityAudit.log({
        action: SecurityAuditAction.AUTH_SIGNIN_FAILED,
        actorId: user.id,
        ipAddress,
        metadata: { reason: 'admin_totp_setup_incomplete' },
      });
      throw new UnauthorizedException(
        'Complete 2FA setup before signing in again.',
      );
    }

    if (this.adminAuthService.requiresTotp(user)) {
      if (!dto.totpCode) {
        await this.securityAudit.log({
          action: SecurityAuditAction.AUTH_SIGNIN_FAILED,
          actorId: user.id,
          ipAddress,
          metadata: { reason: 'totp_required' },
        });
        throw new UnauthorizedException('Admin accounts require a 2FA code');
      }
      const totpValid = await this.adminAuthService.verifyTotp(
        user.id,
        dto.totpCode,
      );
      if (!totpValid) {
        await this.securityAudit.log({
          action: SecurityAuditAction.AUTH_SIGNIN_FAILED,
          actorId: user.id,
          ipAddress,
          metadata: { reason: 'invalid_totp' },
        });
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    await this.revokeAllRefreshTokens(user.id);
    const session = await this.createSession(user);

    await this.securityAudit.log({
      actorId: user.id,
      actorEmail: user.email,
      action: SecurityAuditAction.AUTH_SIGNIN_SUCCESS,
      ipAddress,
    });

    return session;
  }

  async signOut(userId: string, ipAddress?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    await this.prisma.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });
    await this.revokeAllRefreshTokens(userId);

    if (user) {
      await this.securityAudit.log({
        actorId: user.id,
        actorEmail: user.email,
        action: SecurityAuditAction.AUTH_SIGNOUT,
        ipAddress,
      });
    }
  }

  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toSafeUser(user) : null;
  }
}

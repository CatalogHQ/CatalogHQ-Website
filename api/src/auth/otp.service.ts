import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { EmailOtpPurpose } from '@prisma/client';
import { normalizeEmail } from '../common/email.util';
import { PingramEmailService } from '../notifications/pingram-email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse } from './auth.types';
import { AuthService } from './auth.service';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { OtpVerifyAttemptService } from './otp-verify-attempt.service';

const OTP_TTL_MS = 10 * 60 * 1000;
const SIGNUP_PENDING_TTL_MS = 30 * 60 * 1000;
const GENERIC_OTP_ERROR = 'Invalid or expired verification code';
const GENERIC_SIGNUP_ERROR = 'Unable to complete sign-up. Please try again.';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: PingramEmailService,
    private readonly authService: AuthService,
    private readonly otpRateLimitService: OtpRateLimitService,
    private readonly otpVerifyAttemptService: OtpVerifyAttemptService,
  ) {}

  private generateCode(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  private assertEmailConfigured(): void {
    if (!this.emailService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Contact support.',
      );
    }
  }

  private async sendOtpEmail(
    email: string,
    code: string,
    purpose: 'signup' | 'password_reset',
  ): Promise<void> {
    const subject =
      purpose === 'signup'
        ? 'Verify your CatalogHQ account'
        : 'Reset your CatalogHQ password';
    const intro =
      purpose === 'signup'
        ? 'Use this code to finish creating your CatalogHQ account:'
        : 'Use this code to reset your CatalogHQ password:';
    const htmlBody = `<p>Hi,</p><p>${intro}</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p><p>CatalogHQ Team</p>`;

    await this.emailService.sendEmail(email, subject, htmlBody, undefined, {
      required: true,
      type: 'verification_code',
    });
  }

  private async createEmailOtp(
    email: string,
    purpose: EmailOtpPurpose,
    ipAddress: string,
  ): Promise<string> {
    await this.otpRateLimitService.recordOtpSend(email, ipAddress);

    await this.prisma.emailOtp.updateMany({
      where: { email, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.emailOtp.create({
      data: {
        email,
        purpose,
        codeHash,
        expiresAt,
      },
    });

    return code;
  }

  private async validateEmailOtp(
    email: string,
    code: string,
    purpose: EmailOtpPurpose,
  ): Promise<void> {
    await this.otpVerifyAttemptService.assertCanAttempt(email);

    const otp = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      await this.otpVerifyAttemptService.recordFailedAttempt(email);
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      await this.otpVerifyAttemptService.recordFailedAttempt(email);
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    await this.otpVerifyAttemptService.resetAttempts(email);

    await this.prisma.emailOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }

  async initSignUp(
    email: string,
    password: string,
    ipAddress: string,
  ): Promise<void> {
    this.assertEmailConfigured();

    const normalized = normalizeEmail(email);
    await this.otpRateLimitService.assertCanSendOtp(normalized, ipAddress);
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      throw new UnauthorizedException(GENERIC_SIGNUP_ERROR);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + SIGNUP_PENDING_TTL_MS);

    await this.prisma.signupPending.upsert({
      where: { email: normalized },
      create: { email: normalized, passwordHash, expiresAt },
      update: { passwordHash, expiresAt },
    });

    const code = await this.createEmailOtp(
      normalized,
      EmailOtpPurpose.signup,
      ipAddress,
    );

    try {
      await this.sendOtpEmail(normalized, code, 'signup');
    } catch (error) {
      await this.prisma.emailOtp.updateMany({
        where: {
          email: normalized,
          purpose: EmailOtpPurpose.signup,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      throw error;
    }
  }

  async resendSignUpOtp(
    email: string,
    password: string,
    ipAddress: string,
  ): Promise<void> {
    this.assertEmailConfigured();

    const normalized = normalizeEmail(email);
    await this.otpRateLimitService.assertCanSendOtp(normalized, ipAddress);

    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      throw new UnauthorizedException(GENERIC_SIGNUP_ERROR);
    }

    const pending = await this.prisma.signupPending.findUnique({
      where: { email: normalized },
    });

    if (!pending) {
      throw new UnauthorizedException(GENERIC_SIGNUP_ERROR);
    }

    const passwordMatches = await bcrypt.compare(
      password,
      pending.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const expiresAt = new Date(Date.now() + SIGNUP_PENDING_TTL_MS);

    await this.prisma.signupPending.update({
      where: { email: normalized },
      data: { expiresAt },
    });

    const code = await this.createEmailOtp(
      normalized,
      EmailOtpPurpose.signup,
      ipAddress,
    );

    try {
      await this.sendOtpEmail(normalized, code, 'signup');
    } catch (error) {
      await this.prisma.emailOtp.updateMany({
        where: {
          email: normalized,
          purpose: EmailOtpPurpose.signup,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      throw error;
    }
  }

  async verifySignUp(
    email: string,
    code: string,
  ): Promise<{ user: AuthResponse['user']; token: string }> {
    const normalized = normalizeEmail(email);

    const pending = await this.prisma.signupPending.findUnique({
      where: { email: normalized },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    await this.validateEmailOtp(normalized, code, EmailOtpPurpose.signup);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalized,
          passwordHash: pending.passwordHash,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.vendorSubscription.create({
        data: {
          vendorId: created.id,
          status: 'pending',
          planTier: 'starter',
        },
      });

      await tx.signupPending.delete({ where: { email: normalized } });
      return created;
    });

    return this.authService.createSession(user);
  }

  async sendPasswordResetOtp(email: string, ipAddress: string): Promise<void> {
    this.assertEmailConfigured();

    const normalized = normalizeEmail(email);
    await this.otpRateLimitService.assertCanSendOtp(normalized, ipAddress);

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      await this.otpRateLimitService.recordOtpSend(normalized, ipAddress);
      return;
    }

    const code = await this.createEmailOtp(
      normalized,
      EmailOtpPurpose.password_reset,
      ipAddress,
    );
    await this.sendOtpEmail(normalized, code, 'password_reset');
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const normalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    await this.validateEmailOtp(
      normalized,
      code,
      EmailOtpPurpose.password_reset,
    );

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
  }
}

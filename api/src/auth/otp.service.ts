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
import { SendChampService } from '../notifications/sendchamp.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse } from './auth.types';
import { AuthService } from './auth.service';

const OTP_TTL_MS = 10 * 60 * 1000;
const SIGNUP_PENDING_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sendChamp: SendChampService,
    private readonly authService: AuthService,
  ) {}

  private generateCode(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  private assertSendChampConfigured(): void {
    if (!this.sendChamp.isConfigured()) {
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

    await this.sendChamp.sendEmail(email, subject, htmlBody, undefined, {
      required: true,
    });
  }

  private async createEmailOtp(
    email: string,
    purpose: EmailOtpPurpose,
  ): Promise<string> {
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
      throw new BadRequestException('Invalid or expired code.');
    }

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      throw new BadRequestException('Invalid or expired code.');
    }

    await this.prisma.emailOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }

  async initSignUp(email: string, password: string): Promise<void> {
    this.assertSendChampConfigured();

    const normalized = normalizeEmail(email);
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + SIGNUP_PENDING_TTL_MS);

    await this.prisma.signupPending.upsert({
      where: { email: normalized },
      create: { email: normalized, passwordHash, expiresAt },
      update: { passwordHash, expiresAt },
    });

    const code = await this.createEmailOtp(normalized, EmailOtpPurpose.signup);

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

  async resendSignUpOtp(email: string, password: string): Promise<void> {
    this.assertSendChampConfigured();

    const normalized = normalizeEmail(email);
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email already exists. Sign in instead.',
      );
    }

    const pending = await this.prisma.signupPending.findUnique({
      where: { email: normalized },
    });

    if (!pending) {
      throw new NotFoundException(
        'No pending sign-up found for this email. Create an account first.',
      );
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

    const code = await this.createEmailOtp(normalized, EmailOtpPurpose.signup);

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

  async verifySignUp(email: string, code: string): Promise<AuthResponse> {
    const normalized = normalizeEmail(email);

    const pending = await this.prisma.signupPending.findUnique({
      where: { email: normalized },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new BadRequestException(
        'Sign-up session expired. Please start again.',
      );
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

      await tx.signupPending.delete({ where: { email: normalized } });
      return created;
    });

    return this.authService.createSession(user);
  }

  async sendPasswordResetOtp(email: string): Promise<void> {
    this.assertSendChampConfigured();

    const normalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      throw new NotFoundException('No account found for this email.');
    }

    const code = await this.createEmailOtp(
      normalized,
      EmailOtpPurpose.password_reset,
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
      throw new NotFoundException('No account found for this email.');
    }

    await this.validateEmailOtp(
      normalized,
      code,
      EmailOtpPurpose.password_reset,
    );

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }
}

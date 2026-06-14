import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { encryptNIN, decryptNIN } from '../lib/encryption';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async setupTotp(userId: string): Promise<{ qrCodeDataUrl: string }> {
    const secret = speakeasy.generateSecret({
      name: `CatalogHQ Admin (${userId})`,
      length: 32,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error('Failed to generate TOTP secret');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptNIN(secret.base32),
        totpEnabled: false,
        totpVerifiedAt: null,
      },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    return { qrCodeDataUrl };
  }

  async enableTotp(userId: string, token: string): Promise<void> {
    const valid = await this.verifyTotp(userId, token);
    if (!valid) {
      throw new BadRequestException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabled: true,
        totpVerifiedAt: new Date(),
      },
    });
  }

  async verifyTotp(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      return false;
    }

    const secret = decryptNIN(user.totpSecret);
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  requiresTotp(user: { role: string; totpEnabled: boolean }): boolean {
    return user.role === 'admin' && user.totpEnabled;
  }
}

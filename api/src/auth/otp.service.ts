import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { SendChampService } from '../notifications/sendchamp.service';
import { normalizePhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';

const OTP_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sendChamp: SendChampService,
  ) {}

  private generateCode(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  async sendPasswordResetOtp(phone: string): Promise<void> {
    const normalized = normalizePhone(phone);
    const user = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });

    if (!user) {
      throw new NotFoundException('No account found for this phone number.');
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.passwordOtp.create({
      data: {
        phone: normalized,
        codeHash,
        expiresAt,
      },
    });

    const message = `Your CatalogHQ password reset code is ${code}. It expires in 10 minutes. Do not share this code.`;
    await this.sendChamp.sendSms(normalized, message);
  }

  async resetPassword(
    phone: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const normalized = normalizePhone(phone);
    const user = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });

    if (!user) {
      throw new NotFoundException('No account found for this phone number.');
    }

    const otp = await this.prisma.passwordOtp.findFirst({
      where: {
        phone: normalized,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired reset code.');
    }

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      throw new BadRequestException('Invalid or expired reset code.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}

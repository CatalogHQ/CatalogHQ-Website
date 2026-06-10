import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhone } from '../common/phone.util';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthResponse, SafeUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email ?? undefined,
      planTier: user.planTier,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private createSession(user: User): AuthResponse {
    const token = this.jwtService.sign({ sub: user.id });
    return {
      user: this.toSafeUser(user),
      session: {
        userId: user.id,
        token,
      },
    };
  }

  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    const phone = normalizePhone(dto.phone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (existing) {
      throw new ConflictException(
        'An account with this phone number already exists.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone,
        email: dto.email?.trim() || null,
        passwordHash,
      },
    });

    return this.createSession(user);
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    const phone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    return this.createSession(user);
  }

  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toSafeUser(user) : null;
  }
}

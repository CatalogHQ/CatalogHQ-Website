import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { normalizeEmail } from '../common/email.util';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
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
      email: user.email,
      phone: user.phone ?? undefined,
      planTier: user.planTier,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  createSession(user: User): AuthResponse {
    const token = this.jwtService.sign({ sub: user.id });
    return {
      user: this.toSafeUser(user),
      session: {
        userId: user.id,
        token,
      },
    };
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createSession(user);
  }

  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toSafeUser(user) : null;
  }
}

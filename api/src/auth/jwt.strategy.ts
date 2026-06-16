import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserRole } from '@prisma/client';
import { AuthenticatedUser } from './authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  sv?: number;
  aso?: 1;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookies = request?.cookies as { session?: string } | undefined;
          return cookies?.session ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if ((payload.sv ?? 0) !== user.sessionVersion) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const adminSetupOnly =
      user.role === UserRole.admin &&
      !user.totpEnabled &&
      payload.aso === 1;

    return { ...user, adminSetupOnly } satisfies AuthenticatedUser;
  }
}

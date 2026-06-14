import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthService } from '../admin/admin-auth.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { OtpVerifyAttemptService } from './otp-verify-attempt.service';
import { OtpService } from './otp.service';

@Module({
  imports: [
    NotificationsModule,
    SubscriptionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') ?? '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AdminAuthService,
    OtpRateLimitService,
    OtpVerifyAttemptService,
    OtpService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, AdminAuthService, JwtAuthGuard, PassportModule, JwtModule],
})
export class AuthModule {}

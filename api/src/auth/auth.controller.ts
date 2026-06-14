import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import { getClientIp } from '../common/client-ip.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifySignUpDto } from './dto/verify-sign-up.dto';
import { OtpService } from './otp.service';
import { clearSessionCookie, setSessionCookie } from './session-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  async signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    await this.otpService.initSignUp(
      dto.email,
      dto.password,
      getClientIp(req),
    );
    return { success: true };
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 300_000 } })
  @Post('signup/verify')
  async verifySignUp(
    @Body() dto: VerifySignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.otpService.verifySignUp(dto.email, dto.code);
    setSessionCookie(res, result.token, this.configService);
    return { user: result.user };
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('signup/resend-otp')
  async resendSignUpOtp(@Body() dto: SignInDto, @Req() req: Request) {
    await this.otpService.resendSignUpOtp(
      dto.email,
      dto.password,
      getClientIp(req),
    );
    return { success: true };
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('signin')
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(dto);
    setSessionCookie(res, result.token, this.configService);
    return { user: result.user };
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    await this.otpService.sendPasswordResetOtp(dto.email, getClientIp(req));
    return { success: true };
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 300_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.otpService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: User) {
    return { user: await this.authService.toSafeUser(user) };
  }

  @Post('signout')
  signOut(@Res({ passthrough: true }) res: Response) {
    clearSessionCookie(res, this.configService);
    return { success: true };
  }
}

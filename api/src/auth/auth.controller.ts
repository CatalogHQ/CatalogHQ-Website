import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import { getClientIp } from '../common/client-ip.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequireOrigin } from '../common/decorators/require-origin.decorator';
import { AuthService } from './auth.service';
import {
  clearCsrfCookie,
  createCsrfToken,
  setCsrfCookie,
} from './csrf-cookie.util';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifySignUpDto } from './dto/verify-sign-up.dto';
import { OtpService } from './otp.service';
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from './refresh-token-cookie.util';
import { clearSessionCookie, setSessionCookie } from './session-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {}

  private issueAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    setSessionCookie(res, accessToken, this.configService);
    setRefreshCookie(res, refreshToken, this.configService);
    setCsrfCookie(res, createCsrfToken(), this.configService);
  }

  private clearAuthCookies(res: Response): void {
    clearSessionCookie(res, this.configService);
    clearRefreshCookie(res, this.configService);
    clearCsrfCookie(res, this.configService);
  }

  @Public()
  @RequireOrigin()
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
  @RequireOrigin()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('signup/verify')
  async verifySignUp(
    @Body() dto: VerifySignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.otpService.verifySignUp(dto.email, dto.code);
    this.issueAuthCookies(res, result.token, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @RequireOrigin()
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
  @RequireOrigin()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('signin')
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(dto, getClientIp(req));
    this.issueAuthCookies(res, result.token, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @RequireOrigin()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const result = await this.authService.refreshSession(
      cookies?.[REFRESH_COOKIE_NAME],
      getClientIp(req),
    );
    this.issueAuthCookies(res, result.token, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @RequireOrigin()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    await this.otpService.sendPasswordResetOtp(dto.email, getClientIp(req));
    return { success: true };
  }

  @Public()
  @RequireOrigin()
  @Throttle({ auth: { limit: 5, ttl: 300_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    await this.otpService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
      getClientIp(req),
    );
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    setCsrfCookie(res, createCsrfToken(), this.configService);
    return { user: await this.authService.toSafeUser(user) };
  }

  @Post('signout')
  async signOut(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signOut(user.id, getClientIp(req));
    this.clearAuthCookies(res);
    return { success: true };
  }
}

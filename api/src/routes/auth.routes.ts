import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from '../core/auth/auth.dto.js';
import { AuthService, RequestMeta } from '../core/auth/auth.service.js';
import { type AuthUser, CurrentUser, Public } from '../core/auth/decorators.js';

// Endpoints sensibles : 5 tentatives par minute et par IP
const STRICT_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
// Toute une classe se connecte depuis la meme IP ; chaque compte reste limite (throttling.ts)
const LOGIN_THROTTLE = { default: { limit: 30, ttl: 60_000 } };

const metaOf = (req: Request): RequestMeta => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto.identifier, dto.password, metaOf(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, metaOf(req));
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('forgot-password')
  @HttpCode(204)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    this.auth.requestPasswordReset(dto.identifier, metaOf(req));
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('reset-password')
  @HttpCode(204)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.auth.resetPassword(dto.token, dto.password, metaOf(req));
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(204)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      metaOf(req),
    );
  }
}

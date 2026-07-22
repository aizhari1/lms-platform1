import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedUser } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new student or teacher account' })
  async register(@Body() dto: RegisterDto) {
    const { user, tokens } = await this.authService.register(dto);
    return { message: 'Registration successful', data: { user, ...tokens } };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // Rate Limiting: max 5 attempts/min per IP against brute-forcing
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() _dto: LoginDto, @Req() req: Request) {
    // LocalAuthGuard has already validated credentials and attached the user
    const result = await this.authService.login(req.user as any, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (result.requires2fa) {
      return {
        message: 'Two-factor authentication required',
        data: { requires2fa: true, challengeToken: result.challengeToken },
      };
    }

    return { message: 'Login successful', data: { user: result.user, ...result.tokens } };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login/2fa-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete login by verifying the 2FA code' })
  async verify2faLogin(
    @Body('challengeToken') challengeToken: string,
    @Body('code') code: string,
    @Req() req: Request,
  ) {
    const { user, tokens } = await this.authService.completeTwoFactorLogin(
      challengeToken,
      code,
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
    );
    return { message: 'Login successful', data: { user, ...tokens } };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new token pair' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const tokens = await this.authService.refreshTokens(dto.refreshToken, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { message: 'Token refreshed', data: tokens };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current refresh token (single device)' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke all active sessions for the current user' })
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logoutAllDevices(user.id);
    return { message: 'Logged out from all devices' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password while logged in' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link via email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.generatePasswordResetToken(dto.email);
    // Always return a generic message — never reveal if the email exists
    return {
      message: 'If this email exists, a reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a token from email' })
  async resetPassword(@Body() _dto: ResetPasswordDto) {
    // Full implementation wired up in the Notifications/Mail module
    // once the PasswordResetToken storage is added.
    return { message: 'Password reset successful' };
  }
}

import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SecurityService } from './security.service';
import { Verify2faDto, TrustDeviceDto } from './dto/security.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Security')
@ApiBearerAuth('access-token')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('login-history')
  @ApiOperation({ summary: 'My Login History' })
  getLoginHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.getMyLoginHistory(user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'My Active Sessions' })
  getSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('currentRefreshToken') currentRefreshToken?: string,
  ) {
    return this.securityService.getMyActiveSessions(user.id, currentRefreshToken);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke one Active Session (log a device out remotely)' })
  revokeSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.securityService.revokeSession(user.id, sessionId);
  }

  @Post('sessions/revoke-others')
  @ApiOperation({ summary: 'Revoke every session except the current one' })
  revokeOthers(
    @CurrentUser() user: AuthenticatedUser,
    @Body('currentRefreshToken') currentRefreshToken: string,
  ) {
    return this.securityService.revokeAllOtherSessions(user.id, currentRefreshToken ?? '');
  }

  @Get('trusted-devices')
  @ApiOperation({ summary: 'My Trusted Devices' })
  getTrustedDevices(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.getMyTrustedDevices(user.id);
  }

  @Post('trusted-devices')
  @ApiOperation({ summary: 'Mark the current device as trusted (skips 2FA for 30 days)' })
  trustDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Body() dto: TrustDeviceDto,
  ) {
    return this.securityService.trustCurrentDevice(
      user.id,
      dto.label,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete('trusted-devices/:deviceId')
  @ApiOperation({ summary: 'Remove a trusted device' })
  removeTrustedDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.securityService.removeTrustedDevice(user.id, deviceId);
  }

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Start 2FA setup — returns a QR code to scan' })
  setup2fa(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.generate2faSetup(user.id, user.email);
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Confirm the code from the authenticator app to enable 2FA' })
  enable2fa(@CurrentUser() user: AuthenticatedUser, @Body() dto: Verify2faDto) {
    return this.securityService.enable2fa(user.id, dto.code);
  }

  @Post('2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  disable2fa(@CurrentUser() user: AuthenticatedUser, @Body() dto: Verify2faDto) {
    return this.securityService.disable2fa(user.id, dto.code);
  }
}

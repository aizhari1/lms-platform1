import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findMyNotifications(user.id, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the count of unread notifications (for the bell badge)' })
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('devices')
  @ApiOperation({ summary: 'Register a device FCM token to receive push notifications' })
  registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(
      user.id,
      dto.fcmToken,
      dto.deviceType,
    );
  }

  @Delete('devices/:fcmToken')
  @ApiOperation({ summary: 'Unregister a device (e.g. on logout)' })
  unregisterDevice(@Param('fcmToken') fcmToken: string) {
    return this.notificationsService.unregisterDevice(fcmToken);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get my notification preferences per type/channel' })
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update my notification preferences per type/channel' })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, dto.preferences);
  }
}

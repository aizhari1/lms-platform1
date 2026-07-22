import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminTemplatesService } from './admin-templates.service';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin — Templates')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/templates')
export class AdminTemplatesController {
  constructor(private readonly templatesService: AdminTemplatesService) {}

  @Get('emails')
  @ApiOperation({ summary: '[Admin] Email Templates — list all' })
  findAllEmails() {
    return this.templatesService.findAllEmailTemplates();
  }

  @Put('emails/:key')
  @ApiOperation({ summary: '[Admin] Email Templates — create or update by key' })
  upsertEmail(
    @Param('key') key: string,
    @Body() body: { nameAr: string; subject: string; bodyHtml: string },
  ) {
    return this.templatesService.upsertEmailTemplate(key, body);
  }

  @Get('notifications')
  @ApiOperation({ summary: '[Admin] Notification Templates — list all' })
  findAllNotifications() {
    return this.templatesService.findAllNotificationTemplates();
  }

  @Put('notifications/:key')
  @ApiOperation({ summary: '[Admin] Notification Templates — create or update by key' })
  upsertNotification(
    @Param('key') key: string,
    @Body() body: { nameAr: string; titleAr: string; bodyAr: string },
  ) {
    return this.templatesService.upsertNotificationTemplate(key, body);
  }
}

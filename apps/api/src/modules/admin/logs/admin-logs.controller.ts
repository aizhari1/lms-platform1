import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction, Role } from '@prisma/client';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin — Logs')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/logs')
export class AdminLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('audit')
  @ApiOperation({ summary: '[Admin] Audit Logs — every recorded action, filterable' })
  findAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
  ) {
    return this.auditLogService.findAll({ userId, action, entityType });
  }

  @Get('activity')
  @ApiOperation({ summary: '[Admin] Activity Logs — content/data changes (excludes login/logout)' })
  findActivityLogs() {
    return this.auditLogService.findActivityLogs();
  }

  @Get('login')
  @ApiOperation({ summary: '[Admin] Login Logs — authentication events only' })
  findLoginLogs() {
    return this.auditLogService.findLoginLogs();
  }
}

import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminSystemService } from './admin-system.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@ApiTags('Admin — System Tools')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/system')
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  @Get('health')
  @ApiOperation({ summary: '[Admin] System Health Dashboard' })
  getHealth() {
    return this.systemService.getSystemHealth();
  }

  @Get('cache')
  @ApiOperation({ summary: '[Admin] Cache Manager — stats' })
  getCacheStats() {
    return this.systemService.getCacheStats();
  }

  @Post('cache/flush')
  @ApiOperation({ summary: '[Admin] Cache Manager — flush all cached data' })
  flushCache() {
    return this.systemService.flushCache();
  }

  @Get('storage')
  @ApiOperation({ summary: '[Admin] Storage Manager — file counts by bucket/type' })
  getStorage() {
    return this.systemService.getStorageStats();
  }

  @Get('backups')
  @ApiOperation({ summary: '[Admin] Backup Manager — list past backups' })
  findBackups() {
    return this.systemService.findBackups();
  }

  @Post('backups')
  @ApiOperation({ summary: '[Admin] Backup Manager — trigger a new backup' })
  triggerBackup(@CurrentUser() user: AuthenticatedUser) {
    return this.systemService.triggerBackup(user.id);
  }

  @Get('jobs')
  @ApiOperation({ summary: '[Admin] Queue Monitor — recent background job runs' })
  getJobs(@Query('status') status?: string) {
    return this.systemService.getBackgroundJobs(status);
  }

  @Get('jobs/stats')
  @ApiOperation({ summary: '[Admin] Queue Monitor — job counts by status' })
  getJobStats() {
    return this.systemService.getQueueStats();
  }
}

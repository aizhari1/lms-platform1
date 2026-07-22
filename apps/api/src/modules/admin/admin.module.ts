import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './analytics/admin-analytics.controller';
import { AdminAnalyticsService } from './analytics/admin-analytics.service';
import { CmsController } from './cms/cms.controller';
import { CmsService } from './cms/cms.service';
import { AdminSystemController } from './system/admin-system.controller';
import { AdminSystemService } from './system/admin-system.service';
import { AdminLogsController } from './logs/admin-logs.controller';
import { AdminTemplatesController } from './templates/admin-templates.controller';
import { AdminTemplatesService } from './templates/admin-templates.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [AuditLogModule, UploadsModule],
  controllers: [
    AdminAnalyticsController,
    CmsController,
    AdminSystemController,
    AdminLogsController,
    AdminTemplatesController,
  ],
  providers: [AdminAnalyticsService, CmsService, AdminSystemService, AdminTemplatesService],
  exports: [AdminAnalyticsService, CmsService],
})
export class AdminModule {}

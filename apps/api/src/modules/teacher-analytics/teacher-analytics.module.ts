import { Module } from '@nestjs/common';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import { TeacherAnalyticsService } from './teacher-analytics.service';

@Module({
  controllers: [TeacherAnalyticsController],
  providers: [TeacherAnalyticsService],
  exports: [TeacherAnalyticsService],
})
export class TeacherAnalyticsModule {}

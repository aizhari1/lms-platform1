import { Module } from '@nestjs/common';
import { CourseContentController } from './course-content.controller';
import { CourseContentService } from './course-content.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CourseContentController],
  providers: [CourseContentService],
  exports: [CourseContentService],
})
export class CourseContentModule {}

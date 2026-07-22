import { Module } from '@nestjs/common';
import { TeacherBulkController } from './teacher-bulk.controller';
import { TeacherBulkService } from './teacher-bulk.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [TeacherBulkController],
  providers: [TeacherBulkService],
  exports: [TeacherBulkService],
})
export class TeacherBulkModule {}

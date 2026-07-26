import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { BACKGROUND_QUEUE } from './queue.constants';
import { JobsService } from './jobs.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';

@Processor(BACKGROUND_QUEUE)
export class JobsProcessor {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('BULK_EMAIL')
  async handleBulkEmail(
    job: Job<{ jobLogId: string; recipientEmails: string[]; subject: string; bodyHtml: string }>,
  ) {
    const { jobLogId, recipientEmails, subject, bodyHtml } = job.data;
    await this.jobsService.markRunning(jobLogId);
    try {
      for (const email of recipientEmails) {
        await this.mail.sendCustomEmail(email, subject, bodyHtml);
        await job.progress(
          Math.round(((recipientEmails.indexOf(email) + 1) / recipientEmails.length) * 100),
        );
      }
      await this.jobsService.markCompleted(jobLogId);
    } catch (err: any) {
      this.logger.error(`BULK_EMAIL job ${job.id} failed: ${err.message}`);
      await this.jobsService.markFailed(jobLogId, err.message);
      throw err; // let Bull's retry/backoff kick in
    }
  }

  @Process('BULK_NOTIFY')
  async handleBulkNotify(
    job: Job<{
      jobLogId: string;
      userIds: string[];
      titleAr: string;
      bodyAr: string;
      courseId?: string;
    }>,
  ) {
    const { jobLogId, userIds, titleAr, bodyAr, courseId } = job.data;
    await this.jobsService.markRunning(jobLogId);
    try {
      for (const userId of userIds) {
        await this.notifications.notify({
          userId,
          type: 'ANNOUNCEMENT',
          titleAr,
          bodyAr,
          metadata: courseId ? { courseId } : undefined,
        });
      }
      await this.jobsService.markCompleted(jobLogId);
    } catch (err: any) {
      this.logger.error(`BULK_NOTIFY job ${job.id} failed: ${err.message}`);
      await this.jobsService.markFailed(jobLogId, err.message);
      throw err;
    }
  }

  @Process('AWARD_STREAK_BADGES_SWEEP')
  async handleStreakSweep(job: Job<{ jobLogId: string }>) {
    // Placeholder hook for a nightly cron (see ScheduleModule already
    // registered in app.module.ts) that could re-check streak-based
    // badges in bulk. Left intentionally light — most badge awarding
    // already happens inline via AchievementsService.
    await this.jobsService.markRunning(job.data.jobLogId);
    await this.jobsService.markCompleted(job.data.jobLogId);
  }
}

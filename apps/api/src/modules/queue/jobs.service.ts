import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { BACKGROUND_QUEUE } from './queue.constants';

export type BackgroundJobType = 'BULK_EMAIL' | 'BULK_NOTIFY' | 'AWARD_STREAK_BADGES_SWEEP';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(BACKGROUND_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Enqueues a job AND writes a BackgroundJobLog row up front (status
   * QUEUED) so the admin Queue Monitor has something real to show
   * immediately, not just after the job finishes.
   */
  async enqueue(jobType: BackgroundJobType, payload: Record<string, unknown>) {
    const log = await this.prisma.backgroundJobLog.create({
      data: { jobType, status: 'QUEUED', payload: payload as any },
    });

    await this.queue.add(
      jobType,
      { ...payload, jobLogId: log.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return log;
  }

  async markRunning(jobLogId: string) {
    await this.prisma.backgroundJobLog
      .update({ where: { id: jobLogId }, data: { status: 'RUNNING' } })
      .catch(() => undefined);
  }

  async markCompleted(jobLogId: string) {
    await this.prisma.backgroundJobLog
      .update({ where: { id: jobLogId }, data: { status: 'COMPLETED', finishedAt: new Date() } })
      .catch(() => undefined);
  }

  async markFailed(jobLogId: string, errorMessage: string) {
    await this.prisma.backgroundJobLog
      .update({
        where: { id: jobLogId },
        data: { status: 'FAILED', finishedAt: new Date(), errorMessage },
      })
      .catch(() => undefined);
  }
}

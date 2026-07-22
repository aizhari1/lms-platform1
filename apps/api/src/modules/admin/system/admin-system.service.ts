import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { UploadsService } from '../../uploads/uploads.service';

@Injectable()
export class AdminSystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly uploads: UploadsService,
  ) {}

  // -----------------------------------------------------------------
  // SYSTEM HEALTH DASHBOARD
  // -----------------------------------------------------------------
  async getSystemHealth() {
    const dbCheck = await this.checkDatabase();
    const cacheStats = await this.cache.getStats();
    const memory = process.memoryUsage();

    return {
      status: dbCheck.isHealthy ? 'HEALTHY' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbCheck,
      cache: cacheStats,
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<{ isHealthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { isHealthy: true, latencyMs: Date.now() - start };
    } catch {
      return { isHealthy: false, latencyMs: Date.now() - start };
    }
  }

  // -----------------------------------------------------------------
  // CACHE MANAGER
  // -----------------------------------------------------------------
  async getCacheStats() {
    return this.cache.getStats();
  }

  async flushCache() {
    await this.cache.flushAll();
    return { success: true };
  }

  // -----------------------------------------------------------------
  // STORAGE MANAGER
  // -----------------------------------------------------------------
  async getStorageStats() {
    const [videoCount, resourceCount, avatarLikeCounts] = await Promise.all([
      this.prisma.lesson.count({ where: { videoUrl: { not: null } } }),
      this.prisma.lessonResource.count(),
      this.prisma.user.count({ where: { avatarUrl: { not: null } } }),
    ]);

    const totalCertificatePdfs = await this.prisma.certificate.count({
      where: { pdfUrl: { not: null } },
    });
    const totalInvoicePdfs = await this.prisma.order.count({
      where: { invoiceUrl: { not: null } },
    });

    return {
      buckets: {
        courseVideos: videoCount,
        lessonResources: resourceCount,
        avatars: avatarLikeCounts,
        certificates: totalCertificatePdfs,
        invoices: totalInvoicePdfs,
      },
    };
  }

  // -----------------------------------------------------------------
  // BACKUP MANAGER
  // -----------------------------------------------------------------
  async findBackups() {
    return this.prisma.backupRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  }

  /**
   * Triggers a database dump. Actual `pg_dump` execution is
   * environment-specific (needs the pg_dump binary + DB credentials on
   * the host running the API) — this records the request and status so
   * the ops/deploy script can pick it up, or a developer can wire the
   * exec() call for their specific hosting setup.
   */
  async triggerBackup(adminId: string) {
    return this.prisma.backupRecord.create({
      data: {
        fileUrl: '',
        status: 'RUNNING',
        triggeredBy: adminId,
      },
    });
  }

  // -----------------------------------------------------------------
  // QUEUE MONITOR
  // -----------------------------------------------------------------
  async getBackgroundJobs(status?: string) {
    return this.prisma.backgroundJobLog.findMany({
      where: status ? { status } : undefined,
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
  }

  async getQueueStats() {
    const jobs = await this.prisma.backgroundJobLog.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return jobs.reduce(
      (acc, j) => ({ ...acc, [j.status]: j._count._all }),
      {} as Record<string, number>,
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { BadgeCode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Call this whenever a student records any learning activity
   * (lesson progress update). Updates the daily streak counter and
   * awards streak badges when milestones are hit.
   *
   * Streak rules:
   *  - Same calendar day as last activity -> no change.
   *  - Exactly the next calendar day -> streak continues (+1).
   *  - Any bigger gap -> streak resets to 1.
   */
  async recordActivity(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
    });
    if (!user) return;

    const today = this.startOfDay(new Date());
    const lastActivity = user.lastActivityDate ? this.startOfDay(user.lastActivityDate) : null;

    let nextStreak = user.currentStreak;

    if (!lastActivity) {
      nextStreak = 1;
    } else {
      const diffDays = Math.round((today.getTime() - lastActivity.getTime()) / 86_400_000);
      if (diffDays === 0) {
        // Already logged activity today — nothing to update.
        return;
      } else if (diffDays === 1) {
        nextStreak = user.currentStreak + 1;
      } else {
        nextStreak = 1;
      }
    }

    const nextLongest = Math.max(user.longestStreak, nextStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        lastActivityDate: today,
      },
    });

    if (nextStreak >= 7) await this.awardBadge(userId, BadgeCode.STREAK_7_DAYS);
    if (nextStreak >= 30) await this.awardBadge(userId, BadgeCode.STREAK_30_DAYS);
  }

  /** Idempotent — safe to call repeatedly, only ever awards a badge once. */
  async awardBadge(userId: string, code: BadgeCode): Promise<void> {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) {
      this.logger.warn(`Badge with code ${code} not found — did you run the seed?`);
      return;
    }

    await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      update: {},
      create: { userId, badgeId: badge.id },
    });
  }

  async getMyStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
    });

    const today = this.startOfDay(new Date());
    const lastActivity = user?.lastActivityDate ? this.startOfDay(user.lastActivityDate) : null;
    const diffDays = lastActivity
      ? Math.round((today.getTime() - lastActivity.getTime()) / 86_400_000)
      : null;

    return {
      currentStreak: diffDays !== null && diffDays > 1 ? 0 : user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      lastActivityDate: user?.lastActivityDate ?? null,
      isActiveToday: diffDays === 0,
    };
  }

  async getMyBadges(userId: string) {
    const [catalog, earned] = await Promise.all([
      this.prisma.badge.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.userBadge.findMany({ where: { userId } }),
    ]);

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

    return catalog.map((badge) => ({
      id: badge.id,
      code: badge.code,
      titleAr: badge.titleAr,
      titleEn: badge.titleEn,
      descriptionAr: badge.descriptionAr,
      icon: badge.icon,
      isEarned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) ?? null,
    }));
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

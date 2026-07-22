import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FirebaseService } from './firebase.service';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/paginated-result';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  titleAr: string;
  bodyAr: string;
  metadata?: Record<string, unknown>;
  sendPush?: boolean;
}

/** One row per notification type the student can independently toggle. */
export const NOTIFICATION_TYPES: NotificationType[] = [
  'SYSTEM',
  'COURSE_UPDATE',
  'PAYMENT',
  'EXAM',
  'CERTIFICATE',
  'COMMENT_REPLY',
  'ANNOUNCEMENT',
  'MESSAGE',
];

type NotificationPrefs = Record<NotificationType, { inApp: boolean; email: boolean; push: boolean }>;

function defaultPrefs(): NotificationPrefs {
  return NOTIFICATION_TYPES.reduce((acc, type) => {
    acc[type] = { inApp: true, email: true, push: true };
    return acc;
  }, {} as NotificationPrefs);
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Central entry point used by every other module (Payments, Courses,
   * Exams, Community...) to notify a user. Always persists an in-app
   * notification (unless the user disabled that type entirely),
   * and optionally fans out a push notification to registered devices
   * if the user still wants push for this type.
   */
  async notify(params: CreateNotificationParams) {
    const prefs = await this.getPreferences(params.userId);
    const typePrefs = prefs[params.type] ?? { inApp: true, email: true, push: true };

    if (!typePrefs.inApp) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        channel: NotificationChannel.IN_APP,
        titleAr: params.titleAr,
        bodyAr: params.bodyAr,
        metadata: params.metadata as any,
      },
    });

    if (params.sendPush && typePrefs.push) {
      const devices = await this.prisma.userDevice.findMany({
        where: { userId: params.userId },
        select: { fcmToken: true },
      });

      if (devices.length > 0) {
        await this.firebaseService.sendToDevices(
          devices.map((d) => d.fcmToken),
          { title: params.titleAr, body: params.bodyAr },
        );
      }
    }

    return notification;
  }

  // -----------------------------------------------------------------
  // NOTIFICATION PREFERENCES
  // -----------------------------------------------------------------
  async getPreferences(userId: string): Promise<NotificationPrefs> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    const saved = (user?.notificationPrefs as Partial<NotificationPrefs> | null) ?? {};
    return { ...defaultPrefs(), ...saved };
  }

  async updatePreferences(
    userId: string,
    updates: Record<string, { inApp?: boolean; email?: boolean; push?: boolean }>,
  ): Promise<NotificationPrefs> {
    const current = await this.getPreferences(userId);
    const merged = { ...current } as NotificationPrefs;

    for (const [type, toggles] of Object.entries(updates)) {
      const existing = merged[type as NotificationType] ?? { inApp: true, email: true, push: true };
      merged[type as NotificationType] = { ...existing, ...toggles };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: merged as any },
    });

    return merged;
  }

  async findMyNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<unknown>> {
    const [items, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(items, totalItems, page, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // -----------------------------------------------------------------
  // DEVICE REGISTRATION (for push notifications)
  // -----------------------------------------------------------------
  async registerDevice(
    userId: string,
    fcmToken: string,
    deviceType: string,
  ): Promise<void> {
    await this.prisma.userDevice.upsert({
      where: { fcmToken },
      create: { userId, fcmToken, deviceType },
      update: { userId, deviceType },
    });
  }

  async unregisterDevice(fcmToken: string): Promise<void> {
    await this.prisma.userDevice.deleteMany({ where: { fcmToken } });
  }
}

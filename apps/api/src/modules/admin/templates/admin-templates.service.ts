import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Email Templates ---
  async findAllEmailTemplates() {
    return this.prisma.emailTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertEmailTemplate(
    key: string,
    data: { nameAr: string; subject: string; bodyHtml: string },
  ) {
    return this.prisma.emailTemplate.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });
  }

  async findEmailTemplate(key: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { key } });
    if (!template) throw new NotFoundException('Email template not found');
    return template;
  }

  // --- Notification Templates ---
  async findAllNotificationTemplates() {
    return this.prisma.notificationTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertNotificationTemplate(
    key: string,
    data: { nameAr: string; titleAr: string; bodyAr: string },
  ) {
    return this.prisma.notificationTemplate.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });
  }

  async findNotificationTemplate(key: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { key } });
    if (!template) throw new NotFoundException('Notification template not found');
    return template;
  }
}

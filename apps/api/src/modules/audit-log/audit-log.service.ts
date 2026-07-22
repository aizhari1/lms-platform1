import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface LogAuditEventParams {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogAuditEventParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as any,
      },
    });
  }

  /** Audit Logs: full, unfiltered trail — every action, for compliance/debugging. */
  async findAll(filters: { userId?: string; action?: AuditAction; entityType?: string; take?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.take ?? 100,
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });
  }

  /** Login Logs: just the auth events, for security review. */
  async findLoginLogs(take = 100) {
    return this.prisma.auditLog.findMany({
      where: { action: { in: [AuditAction.LOGIN, AuditAction.LOGOUT] } },
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });
  }

  /** Activity Logs: a friendlier, non-security stream (content/data changes). */
  async findActivityLogs(take = 100) {
    return this.prisma.auditLog.findMany({
      where: { action: { notIn: [AuditAction.LOGIN, AuditAction.LOGOUT] } },
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });
  }
}

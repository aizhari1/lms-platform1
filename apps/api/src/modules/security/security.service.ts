import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../database/prisma.service';
import { TotpUtil } from '../../common/utils/totp.util';
import { AuditLogService } from '../audit-log/audit-log.service';

const PASSWORD_HISTORY_LIMIT = 5;

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // -----------------------------------------------------------------
  // LOGIN HISTORY (per-user, self-service view of Audit Logs)
  // -----------------------------------------------------------------
  async getMyLoginHistory(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId, action: { in: ['LOGIN', 'LOGOUT'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { action: true, ipAddress: true, userAgent: true, createdAt: true },
    });
  }

  // -----------------------------------------------------------------
  // ACTIVE SESSIONS
  // -----------------------------------------------------------------
  async getMyActiveSessions(userId: string, currentToken?: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceLabel: s.deviceLabel ?? 'جهاز غير معروف',
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: currentToken ? s.token === currentToken : false,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }
    await this.prisma.refreshToken.update({ where: { id: sessionId }, data: { revoked: true } });
    return { success: true };
  }

  async revokeAllOtherSessions(userId: string, currentToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, token: { not: currentToken }, revoked: false },
      data: { revoked: true },
    });
    return { success: true };
  }

  // -----------------------------------------------------------------
  // TRUSTED DEVICES
  // -----------------------------------------------------------------
  static computeFingerprint(ipAddress?: string, userAgent?: string): string {
    return crypto
      .createHash('sha256')
      .update(`${ipAddress ?? ''}|${userAgent ?? ''}`)
      .digest('hex');
  }

  async trustCurrentDevice(
    userId: string,
    label: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const fingerprint = SecurityService.computeFingerprint(ipAddress, userAgent);
    const expiresAt = new Date(Date.now() + 30 * 86_400_000); // 30 days

    return this.prisma.trustedDevice.upsert({
      where: { userId_fingerprint: { userId, fingerprint } },
      update: { lastUsedAt: new Date(), expiresAt, label },
      create: { userId, fingerprint, label, expiresAt },
    });
  }

  async isDeviceTrusted(userId: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    const fingerprint = SecurityService.computeFingerprint(ipAddress, userAgent);
    const device = await this.prisma.trustedDevice.findUnique({
      where: { userId_fingerprint: { userId, fingerprint } },
    });
    return Boolean(device && device.expiresAt > new Date());
  }

  async getMyTrustedDevices(userId: string) {
    return this.prisma.trustedDevice.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async removeTrustedDevice(userId: string, deviceId: string) {
    const device = await this.prisma.trustedDevice.findUnique({ where: { id: deviceId } });
    if (!device || device.userId !== userId) throw new NotFoundException('Device not found');
    await this.prisma.trustedDevice.delete({ where: { id: deviceId } });
    return { success: true };
  }

  // -----------------------------------------------------------------
  // PASSWORD HISTORY
  // -----------------------------------------------------------------
  /** Call BEFORE saving a new password hash. Throws if it matches a recent one. */
  async assertPasswordNotReused(userId: string, newPlainPassword: string): Promise<void> {
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_HISTORY_LIMIT,
    });

    for (const entry of history) {
      if (await bcrypt.compare(newPlainPassword, entry.passwordHash)) {
        throw new BadRequestException(
          `You've used this password recently — pick one you haven't used in your last ${PASSWORD_HISTORY_LIMIT} changes`,
        );
      }
    }
  }

  async recordPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.passwordHistory.create({ data: { userId, passwordHash } });

    // Prune anything beyond the limit so this table doesn't grow forever.
    const all = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: PASSWORD_HISTORY_LIMIT,
      select: { id: true },
    });
    if (all.length > 0) {
      await this.prisma.passwordHistory.deleteMany({ where: { id: { in: all.map((a) => a.id) } } });
    }
  }

  // -----------------------------------------------------------------
  // TWO-FACTOR AUTHENTICATION
  // -----------------------------------------------------------------
  async generate2faSetup(userId: string, email: string) {
    const secret = TotpUtil.generateSecret();
    // Store un-confirmed secret; only becomes active once verify() succeeds.
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

    const otpAuthUrl = TotpUtil.getOtpAuthUrl(secret, email);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    return { secret, qrCodeDataUrl };
  }

  async enable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Call the setup endpoint first');
    }
    if (!TotpUtil.verify(user.twoFactorSecret, code)) {
      throw new BadRequestException('Invalid verification code');
    }

    const backupCodes = TotpUtil.generateBackupCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorBackupCodes: backupCodes },
    });

    await this.auditLog.log({ userId, action: 'UPDATE', entityType: 'User2FA', entityId: userId });

    return { backupCodes };
  }

  async disable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }
    const isValidTotp = TotpUtil.verify(user.twoFactorSecret, code);
    const isValidBackup = user.twoFactorBackupCodes.includes(code.toUpperCase());
    if (!isValidTotp && !isValidBackup) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });

    await this.auditLog.log({ userId, action: 'UPDATE', entityType: 'User2FA', entityId: userId });

    return { success: true };
  }

  /** Used mid-login (after password check) to verify the 2FA challenge. */
  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) return true; // 2FA off — nothing to check

    if (TotpUtil.verify(user.twoFactorSecret, code)) return true;

    if (user.twoFactorBackupCodes.includes(code.toUpperCase())) {
      // Backup codes are single-use.
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: user.twoFactorBackupCodes.filter((c) => c !== code.toUpperCase()) },
      });
      return true;
    }

    return false;
  }
}

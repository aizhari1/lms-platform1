import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SecurityService } from '../security/security.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
}

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
    private readonly securityService: SecurityService,
  ) {}

  // -----------------------------------------------------------------
  // REGISTER
  // -----------------------------------------------------------------
  async register(dto: RegisterDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role ?? Role.STUDENT,
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    this.logger.log(`New user registered: ${user.email} (${user.role})`);

    // TODO: emit 'user.registered' event -> EmailModule sends verification email

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.toSafeUser(user), tokens };
  }

  // -----------------------------------------------------------------
  // LOGIN
  // -----------------------------------------------------------------
  async validateUserCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash || user.deletedAt) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    if (user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    return user;
  }

  async login(
    user: {
      id: string;
      email: string;
      role: Role;
      fullName: string;
      status: UserStatus;
      avatarUrl: string | null;
    },
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<
    | { user: SafeUser; tokens: AuthTokens; requires2fa?: false }
    | { requires2fa: true; challengeToken: string }
  > {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });

    if (fullUser?.twoFactorEnabled) {
      const isTrusted = await this.securityService.isDeviceTrusted(
        user.id,
        context?.ipAddress,
        context?.userAgent,
      );

      if (!isTrusted) {
        const challengeToken = await this.jwtService.signAsync(
          { sub: user.id, purpose: '2fa-challenge' },
          { secret: this.config.get<string>('jwt.accessSecret'), expiresIn: '5m' },
        );
        return { requires2fa: true, challengeToken };
      }
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, context);

    await this.auditLog.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { user: this.toSafeUser(user), tokens };
  }

  /** Completes login after the password step, once the 2FA code checks out. */
  async completeTwoFactorLogin(
    challengeToken: string,
    code: string,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    let payload: { sub: string; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync(challengeToken, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA challenge');
    }
    if (payload.purpose !== '2fa-challenge') {
      throw new UnauthorizedException('Invalid challenge token');
    }

    const isValid = await this.securityService.verifyLoginCode(payload.sub, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.issueTokens(user.id, user.email, user.role, context);

    await this.auditLog.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { via2fa: true },
    });

    return { user: this.toSafeUser(user), tokens };
  }

  // -----------------------------------------------------------------
  // REFRESH TOKEN ROTATION
  // -----------------------------------------------------------------
  async refreshTokens(
    refreshToken: string,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Rotate: revoke the used refresh token, issue a brand new pair
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    return this.issueTokens(user.id, user.email, user.role, context);
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, revoked: false },
      data: { revoked: true },
    });

    if (stored) {
      await this.auditLog.log({
        userId: stored.userId,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: stored.userId,
      });
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  // -----------------------------------------------------------------
  // PASSWORD MANAGEMENT
  // -----------------------------------------------------------------
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Unable to change password');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsCurrent) {
      throw new UnauthorizedException('New password must be different from your current password');
    }
    await this.securityService.assertPasswordNotReused(userId, newPassword);

    const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    await this.securityService.recordPasswordHistory(userId, user.passwordHash);

    // Security best practice: invalidate all sessions after password change
    await this.logoutAllDevices(userId);
  }

  async generatePasswordResetToken(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether the email exists — caller should show a generic message
      return null;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    // TODO: persist hashed resetToken + expiry (e.g. in a PasswordResetToken table
    // or Redis with TTL) and send via ResendMailService. Omitted here for brevity
    // and expanded in the Notifications/Mail module.

    return resetToken;
  }

  // -----------------------------------------------------------------
  // TOKEN ISSUANCE (private helper)
  // -----------------------------------------------------------------
  private async issueTokens(
    userId: string,
    email: string,
    role: Role,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    const refreshExpiresInDays = 30;
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(
          Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000,
        ),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        deviceLabel: this.describeDevice(context?.userAgent),
      },
    });

    return { accessToken, refreshToken };
  }

  /** Turns a raw User-Agent string into something a human recognizes at a glance. */
  private describeDevice(userAgent?: string): string {
    if (!userAgent) return 'جهاز غير معروف';
    const browser = /Edg\//.test(userAgent)
      ? 'Edge'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent) && !/Chrome/.test(userAgent)
          ? 'Safari'
          : /Firefox\//.test(userAgent)
            ? 'Firefox'
            : 'متصفح';
    const os = /Windows/.test(userAgent)
      ? 'Windows'
      : /Mac OS/.test(userAgent)
        ? 'macOS'
        : /Android/.test(userAgent)
          ? 'Android'
          : /iPhone|iPad/.test(userAgent)
            ? 'iOS'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : 'نظام غير معروف';
    return `${browser} — ${os}`;
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    status: UserStatus;
    avatarUrl: string | null;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    };
  }
}

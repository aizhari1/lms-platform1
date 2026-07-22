import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: Role;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  status: UserStatus;
}

/**
 * JwtStrategy
 * ---------------------------------------------------------------------
 * Validates the Bearer access token on every protected request.
 * Re-fetches a lightweight user record from the DB (not just trusting
 * the token payload) so that a banned/suspended user is rejected
 * immediately even if their token hasn't expired yet.
 * ---------------------------------------------------------------------
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      status: user.status,
    };
  }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    PassportModule,
    AuditLogModule,
    SecurityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: config.get<string>('jwt.accessExpiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    // Applied globally: every route requires a valid JWT unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Applied globally: enforces @Roles(...) metadata after JwtAuthGuard
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}

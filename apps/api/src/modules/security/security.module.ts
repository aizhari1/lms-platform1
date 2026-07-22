import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule
 * ---------------------------------------------------------------------
 * Marked @Global() so every feature module (Users, Courses, Exams...)
 * can inject PrismaService without re-importing this module each time.
 * ---------------------------------------------------------------------
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

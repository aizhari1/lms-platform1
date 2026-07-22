import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

export const BACKGROUND_QUEUE = 'background-jobs';

/**
 * Background Jobs / Queue Processing — wires up the `bull`/`@nestjs/bull`
 * dependencies that were already in package.json but never actually
 * connected to anything. Backed by the same Redis instance CacheService
 * uses (see docker-compose.yml).
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
    BullModule.registerQueue({ name: BACKGROUND_QUEUE }),
    MailModule,
    NotificationsModule,
    UploadsModule,
  ],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService],
})
export class QueueModule {}

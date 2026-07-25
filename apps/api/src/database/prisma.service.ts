import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * ---------------------------------------------------------------------
 * Wraps PrismaClient as a NestJS injectable provider so it can be
 * injected into any service across the application via DI.
 *
 * - Connects on module init and disconnects gracefully on shutdown.
 * - Adds query logging in development for easier debugging.
 * - Exposes a `cleanDatabase()` helper used only in test environments.
 * ---------------------------------------------------------------------
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Prisma connected to PostgreSQL');

    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - $on typing for query events is loose in Prisma
      this.$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`${e.query} +${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Prisma disconnected from PostgreSQL');
  }

  /**
   * Danger: wipes all rows from all tables.
   * Only callable when NODE_ENV === 'test' — guarded to avoid
   * accidental data loss in staging/production.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase() can only run in test environment');
    }

    const modelNames = Reflect.ownKeys(this).filter(
      (key): key is string =>
        typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );

    return Promise.all(
      modelNames.map((modelName) => {
        // @ts-ignore - dynamic model access
        return this[modelName].deleteMany?.();
      }),
    ) as unknown as Promise<void>;
  }
}

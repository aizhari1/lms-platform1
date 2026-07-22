import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;
  private readonly defaultTtl: number;

  constructor(private readonly config: ConfigService) {
    this.defaultTtl = this.config.get<number>('redis.ttl') ?? 3600;
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      password: this.config.get<string>('redis.password'),
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    this.client.connect().catch((err) => this.logger.warn(`Redis connect failed: ${err.message}`));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null; // cache is best-effort — never break the request path
    }
  }

  async set(key: string, value: unknown, ttlSeconds = this.defaultTtl): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err: any) {
      this.logger.warn(`Cache set failed for ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key).catch(() => undefined);
  }

  /** Delete every key matching a prefix (e.g. invalidate all `courses:*` on publish). */
  async delByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length > 0) await this.client.del(...keys);
    } catch {
      // best-effort
    }
  }

  /** Cache Manager: connection status + key count + memory usage for the admin panel. */
  async getStats() {
    try {
      const [dbSize, info] = await Promise.all([this.client.dbsize(), this.client.info('memory')]);
      const usedMemoryMatch = info.match(/used_memory_human:(\S+)/);
      return {
        isConnected: this.client.status === 'ready',
        totalKeys: dbSize,
        usedMemory: usedMemoryMatch?.[1] ?? 'unknown',
      };
    } catch {
      return { isConnected: false, totalKeys: 0, usedMemory: 'unknown' };
    }
  }

  /** Cache Manager: flush everything (e.g. after a bad deploy or manual invalidation). */
  async flushAll(): Promise<void> {
    await this.client.flushdb();
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}

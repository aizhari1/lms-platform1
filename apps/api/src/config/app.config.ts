import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(
    ',',
  ),
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL_SECONDS || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
}));

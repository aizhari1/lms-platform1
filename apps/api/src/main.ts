import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Body parsing is configured manually below so we can capture the
    // raw request body for the Stripe webhook signature check.
    bodyParser: false,
  });

  // ---------------------------------------------------------------------
  // Body parsing — Stripe's webhook route needs the UNPARSED raw buffer
  // to verify the signature, so it gets its own raw parser BEFORE the
  // general JSON parser runs on every other route.
  // ---------------------------------------------------------------------
  app.use(
    '/api/v1/payments/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    (req: any, _res: any, next: any) => {
      req.rawBody = req.body;
      next();
    },
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1');
  const port = config.get<number>('app.port', 4000);
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);
  const nodeEnv = config.get<string>('app.env', 'development');

  // ---------------------------------------------------------------------
  // Security middlewares
  // ---------------------------------------------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------------------------------------------------------------------
  // Global prefix (e.g. /api/v1/courses). Note: URI versioning is NOT
  // enabled here on purpose — apiPrefix already includes "v1", so adding
  // NestJS's built-in versioning on top of it would double it up into
  // /api/v1/v1/... . If per-route versioning is ever needed, remove the
  // "v1" from apiPrefix first and re-enable enableVersioning() instead.
  // ---------------------------------------------------------------------
  app.setGlobalPrefix(apiPrefix);

  // ---------------------------------------------------------------------
  // Global validation (class-validator DTOs) — strips unknown props,
  // rejects requests with extra fields, auto-transforms payloads.
  // ---------------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 422,
    }),
  );

  // ---------------------------------------------------------------------
  // Global error handling + response shaping
  // ---------------------------------------------------------------------
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ---------------------------------------------------------------------
  // OpenAPI / Swagger documentation — available at /api/docs
  // ---------------------------------------------------------------------
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LMS Platform API')
      .setDescription(
        'REST API documentation for the Educational LMS Platform (Students, Teachers, Admins).',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'access-token',
      )
      .addTag('Auth')
      .addTag('Users')
      .addTag('Courses')
      .addTag('Exams')
      .addTag('Certificates')
      .addTag('Payments')
      .addTag('Notifications')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ---------------------------------------------------------------------
  // Graceful shutdown hooks (important for Docker / PM2 restarts)
  // ---------------------------------------------------------------------
  app.enableShutdownHooks();

  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 API running on: http://localhost:${port}/${apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log(`📄 Swagger docs on: http://localhost:${port}/api/docs`);
}

bootstrap();

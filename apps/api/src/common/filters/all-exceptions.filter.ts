import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * AllExceptionsFilter
 * ---------------------------------------------------------------------
 * Catches every exception thrown anywhere in the app (HTTP exceptions,
 * Prisma errors, or unexpected runtime errors) and normalizes them into
 * one consistent JSON error shape for the frontend to consume:
 *
 * {
 *   "success": false,
 *   "statusCode": 404,
 *   "message": "Course not found",
 *   "error": "Not Found",
 *   "path": "/api/v1/courses/abc",
 *   "timestamp": "2026-07-04T12:00:00.000Z"
 * }
 * ---------------------------------------------------------------------
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        error = (res as any).error || error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma known errors: unique constraint, not found, FK violation...
      statusCode = this.mapPrismaErrorToStatus(exception.code);
      message = this.mapPrismaErrorToMessage(exception);
      error = 'Database Error';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log full stack trace server-side for 5xx errors only
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapPrismaErrorToStatus(code: string): number {
    switch (code) {
      case 'P2002': // Unique constraint violation
        return HttpStatus.CONFLICT;
      case 'P2025': // Record not found
        return HttpStatus.NOT_FOUND;
      case 'P2003': // Foreign key constraint failed
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private mapPrismaErrorToMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[])?.join(', ');
        return `A record with this ${target || 'value'} already exists`;
      }
      case 'P2025':
        return 'The requested record was not found';
      case 'P2003':
        return 'This action violates a related record constraint';
      default:
        return 'A database error occurred';
    }
  }
}

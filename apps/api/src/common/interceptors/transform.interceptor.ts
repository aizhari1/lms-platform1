import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * TransformInterceptor
 * ---------------------------------------------------------------------
 * Wraps every successful controller response in a consistent envelope
 * so the frontend always receives the same top-level shape, whether
 * the endpoint returns a single object, an array, or paginated data.
 * ---------------------------------------------------------------------
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        message: data?.message || 'Request successful',
        data: data?.data !== undefined ? data.data : data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

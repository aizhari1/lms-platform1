import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

/**
 * Keyed by NotificationType (SYSTEM, COURSE_UPDATE, PAYMENT, EXAM,
 * CERTIFICATE, COMMENT_REPLY, ANNOUNCEMENT, MESSAGE) — each value is
 * `{ inApp: boolean, email: boolean, push: boolean }`. Only the keys
 * being changed need to be sent; the rest keep their current value.
 */
export class UpdateNotificationPrefsDto {
  @ApiProperty({
    example: { PAYMENT: { inApp: true, email: true, push: false } },
  })
  @IsObject()
  preferences: Record<string, { inApp?: boolean; email?: boolean; push?: boolean }>;
}

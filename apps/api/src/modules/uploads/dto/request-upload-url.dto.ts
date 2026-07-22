import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const ALLOWED_UPLOAD_FOLDERS = [
  'avatars',
  'course-thumbnails',
  'course-videos',
  'lesson-pdfs',
  'certificates',
  'chat-attachments',
  'assignment-submissions',
  'lesson-resources',
  'subtitles',
] as const;

export class RequestUploadUrlDto {
  @ApiProperty({ example: 'lesson-01.mp4' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  contentType: string;

  @ApiProperty({ enum: ALLOWED_UPLOAD_FOLDERS })
  @IsIn(ALLOWED_UPLOAD_FOLDERS)
  folder: (typeof ALLOWED_UPLOAD_FOLDERS)[number];
}

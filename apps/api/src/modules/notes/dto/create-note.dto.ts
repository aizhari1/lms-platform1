import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'lesson-cuid' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ example: 'تذكير: مراجعة قاعدة الاشتقاق دي' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    required: false,
    example: 125,
    description: 'Video timestamp (seconds) this note refers to, if any',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timestampSec?: number;
}

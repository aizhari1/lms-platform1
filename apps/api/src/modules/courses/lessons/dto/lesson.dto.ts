import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({ example: 'مقدمة عن عناصر HTML' })
  @IsString()
  @MaxLength(150)
  titleAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titleEn?: string;

  @ApiProperty({ enum: LessonType, default: LessonType.VIDEO })
  @IsOptional()
  type?: LessonType;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ required: false, description: 'Set after uploading via the Uploads module' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  videoDurationSec?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  pdfUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  articleContent?: string;

  @ApiProperty({
    required: false,
    description: 'Video chapter markers, e.g. [{ "label": "المقدمة", "timeSec": 0 }]',
    type: 'array',
  })
  @IsOptional()
  videoChapters?: { label: string; timeSec: number }[];

  @ApiProperty({ required: false, description: 'Full lesson transcript text' })
  @IsOptional()
  @IsString()
  transcriptAr?: string;

  @ApiProperty({ required: false, description: 'URL to a .vtt subtitles file' })
  @IsOptional()
  @IsUrl()
  subtitlesUrl?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFreePreview?: boolean;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}

export class ReorderLessonsDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  orderedLessonIds: string[];
}
